// OutgoingTransactionsRoutes.js    

import express from 'express';
import asyncWrapper from '../middelware/asyncwraper.js';
import {
    getUserOutboxTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} from '../controllers/OutgoingTransactionsController.js'; // تم تعديل هذا المسار لاستخدام اسم الملف الجديد
import { verifyToken } from "../middelware/verifyToken.js";


const router = express.Router();

// ===========================================
// مسارات المعاملات (TRANSACTION ROUTES)
// ===========================================

// 1. جلب المعاملات الصادرة للمستخدم (GET /api/transactions/outbox/:user_id)
router.get("/outbox",verifyToken, asyncWrapper(getUserOutboxTransactions));

// استخدام router.route لتطبيق الـ Wrapper على المسارات المشتركة
router.route("/:id")
    // 2. جلب تفاصيل معاملة واحدة (GET /api/transactions/:id)
    .get(verifyToken,asyncWrapper(getTransactionById))
    // 3. تعديل معاملة موجودة (PUT /api/transactions/:id)
    .put(verifyToken,asyncWrapper(updateTransaction))
    // 4. حذف معاملة محددة (DELETE /api/transactions/:id)
    .delete(verifyToken,asyncWrapper(deleteTransaction));

export default router;
