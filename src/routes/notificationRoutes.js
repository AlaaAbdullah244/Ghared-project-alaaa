import express from 'express';
import { getNotification, markAsRead } from '../controllers/notificationController.js'; 
import { verifyToken } from "../middelware/verifyToken.js";

const router = express.Router();

// 1. رابط جلب الإشعارات (يدعم ?page=1&limit=10)
router.get('/', verifyToken, getNotification);

// 2. رابط تحديث حالة الإشعار إلى مقروء
router.put('/:id/read', verifyToken, markAsRead); 

export default router;