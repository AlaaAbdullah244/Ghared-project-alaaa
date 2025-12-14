import express from "express";
import * as draftController from "../controllers/draftController.js";
import multer from "multer";
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";
import { verifyToken } from "../middelware/verifyToken.js"; 
import { validateTransaction } from "../middelware/transactionValidation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// إعداد Multer (نفس الإعداد المستخدم سابقاً لحفظ الملفات في نفس المكان)
const diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/transactions')) 
    },
    filename: function(req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        const filename = `draft-${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: diskStorage });

// ================= Routes =================

// 1. عرض كل المسودات
router.get('/', verifyToken, draftController.getMyDrafts);

// 2. حذف مسودة معينة
router.delete('/:id', verifyToken, draftController.deleteDraft);

// 3. تعديل مسودة (حفظ كمسودة مجدداً OR إرسالها)
// نستخدم PUT للتعديل
router.put(
    '/:id', 
    verifyToken, 
    upload.array('attachments'), // للسماح برفع ملفات جديدة أثناء التعديل
    validateTransaction,         // التحقق من صحة البيانات
    draftController.updateAndPublishDraft
);

export default router;