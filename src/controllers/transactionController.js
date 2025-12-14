import asyncWrapper from "../middelware/asyncwraper.js";
import * as TransData from "../data/transactionData.js"; 
import httpStatusText from "../utils/httpStatusText.js";
import appError from "../utils/appError.js";
import { pool } from "../config/db.js"; 
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export const getTransactionFormData = asyncWrapper(async (req, res, next) => {
    // نفترض أن الـ Token يحتوي على Level، لو مش موجود نخليه 2 كافتراضي
    const userRoleLevel = req.currentUserRole; 
    const types = await TransData.getTransactionTypes();
    const receivers = await TransData.getReceiversByLevel(userRoleLevel);
    res.status(200).json({ status: httpStatusText.SUCCESS, data: { types, receivers } });
});

export const getMyTransactions = asyncWrapper(async (req, res, next) => {
    const userId = req.userId;
    // هنجيب كل المعاملات اللي اليوزر ده بعتها قبل كده
    const results = await TransData.getUserSentTransactions(userId);
    
    res.status(200).json({ 
        status: httpStatusText.SUCCESS, 
        data: results 
    });
}); 




// ✅ دالة الإنشاء المعدلة بناءً على طلبك
// transactionController.js

// export const createTransaction = asyncWrapper(async (req, res, next) => {
//     // 1. استقبال البيانات وتجهيزها
//     const { 
//         parent_transaction_id, type_id, subject, content, 
//         is_draft, receivers 
//     } = req.body;
    
//     const userId = req.userId;
//     const files = req.files; 
//     const io = req.app.get('io'); 

//     // 2. تحويل القيم وضبط المنطق (Logic)
//     const transCode = `TR-${Date.now()}`;
    
//     let finalParentId = null;
//     let currentStateStr = 'معاملة جديدة';
    
//     if (parent_transaction_id && parent_transaction_id !== 'null' && parent_transaction_id !== '') {
//         finalParentId = parent_transaction_id;
//         currentStateStr = 'رد او استدراك'; // يفضل توحيد المسميات (رد أو استدراك)
//     }

//     const isDraftBool = (is_draft === true || is_draft === 'true');

//     const SenderUserDepData = await TransData.getUserDepartmentId(userId);
//     if (!SenderUserDepData) {
//         const error = appError.create("المستخدم غير مسجل في أي قسم", 400, httpStatusText.FAIL);
//         return next(error);
//     }
//     const SenderUserDepId = SenderUserDepData.department_id;

//     const client = await pool.connect();

//     try {
//         await client.query('BEGIN');

      
//         const transId = await TransData.insertTransaction(client, {
//             subject: subject,
//             content: content,
//             type_id: type_id,
//             sender_id: userId,
//             parent_id: finalParentId,
//             is_draft: isDraftBool,
//             current_state: currentStateStr,
//             code: transCode
//         });

//         // =========================================================
//         // الخطوة 2: إدخال المرفقات (Attachments)
//         // =========================================================
//         if (files && files.length > 0) {
//             for (let i = 0; i < files.length; i++) {
//                 // الوصف ممكن ييجي من الـ body لو مبعوت، أو نستخدم اسم الملف
//                 const desc = req.body.descriptions ? req.body.descriptions[i] : files[i].originalname;
                
//                 await TransData.insertAttachment(client, {
//                     path: files[i].filename,
//                     originalname: files[i].originalname,
//                     description: desc,
//                     transaction_id: transId
//                 });
//             }
//         }

//         // =========================================================
//         // الخطوة 3: في حالة الإرسال (ليست مسودة) -> مستلمين + مسار + إشعار
//         // =========================================================
//         if (!isDraftBool) {
//             // Safely ensure receivers is an array and check if it's empty.
//             const receiversArray = receivers ? [].concat(receivers) : [];

//             const notificationMsg = `لديك ${currentStateStr} جديدة بعنوان: ${subject}`;

//             for (const receiverId of receiversArray) {
//                 // أ) إدخال المستلم
//                 await TransData.insertReceiver(client, transId, receiverId);

//                 // ب) جلب قسم المستلم لعمل المسار
//                 const ReceiverUserDepData = await TransData.getUserDepartmentId(receiverId);
                
//                 // ج) تسجيل المسار (Transaction Path)
//                 if (ReceiverUserDepData) {
//                     await TransData.insertTransactionPath(client, {
//                         transId: transId,
//                         fromDeptId: SenderUserDepId,
//                         toDeptId: ReceiverUserDepData.department_id,
//                         notes: 'وارد جديد'
//                     });
//                 }

//                 // د) حفظ الإشعار وإرسال السوكيت 🔥
//                 await TransData.createAndEmitNotification(client, {
//                     userId: receiverId,
//                     transId: transId,
//                     content: notificationMsg,
//                     senderId: userId
//                 }, io);
//             }
//         }

//         await client.query('COMMIT'); // ✅ اعتماد الحفظ

//       res.status(201).json({
//             status: httpStatusText.SUCCESS,
//             message: isDraftBool ? "تم حفظ المسودة بنجاح" : "تم إرسال المعاملة بنجاح",
//             data: { 
//                 transaction_id: transId, 
//                 code: transCode ,
//                 // تعديل هنا: رجعي أوبجكت فيه المعلومات كاملة
//                 attachments: files.map(file => ({
//                     original_name: file.originalname, // عشان يظهر الاسم لليوزر
//                     file_path: file.filename          // عشان يقدر يعمل Download أو Preview
//                 }))
//             }
//         });

//     } catch (error) {
//         await client.query('ROLLBACK'); // ❌ تراجع في حالة الخطأ
//         return next(error);
//     } finally {
//         client.release(); // إغلاق الاتصال
//     }
// });
export const createTransaction = asyncWrapper(async (req, res, next) => {
    // 1. استقبال البيانات
    const { 
        parent_transaction_id, type_id, subject, content, 
        is_draft, receivers 
    } = req.body;
    
    const userId = req.userId;
    const files = req.files; 
    const io = req.app.get('io'); 

    // ✅ (جديد) جلب اسم المرسل لإرساله في الإشعارات
    const senderName = await TransData.getUserName(userId);

    // 2. تحويل القيم
    const transCode = `TR-${Date.now()}`;
    let finalParentId = null;
    let currentStateStr = 'معاملة جديدة';
    
    if (parent_transaction_id && parent_transaction_id !== 'null' && parent_transaction_id !== '') {
        finalParentId = parent_transaction_id;
        currentStateStr = 'رد او استدراك'; 
    }

    const isDraftBool = (is_draft === true || is_draft === 'true');

    // التأكد من القسم
    const SenderUserDepData = await TransData.getUserDepartmentId(userId);
    if (!SenderUserDepData) {
        const error = appError.create("المستخدم غير مسجل في أي قسم", 400, httpStatusText.FAIL);
        return next(error);
    }
    const SenderUserDepId = SenderUserDepData.department_id;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // أ) إدخال المعاملة
        const transId = await TransData.insertTransaction(client, {
            subject: subject,
            content: content,
            type_id: type_id,
            sender_id: userId,
            parent_id: finalParentId,
            is_draft: isDraftBool,
            current_state: currentStateStr,
            code: transCode
        });

        // ب) المرفقات
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const desc = req.body.descriptions ? req.body.descriptions[i] : files[i].originalname;
                await TransData.insertAttachment(client, {
                    path: files[i].filename,
                    originalname: files[i].originalname,
                    description: desc,
                    transaction_id: transId
                });
            }
        }

        // ج) المنطق الخاص بالإرسال (ليس مسودة)
        if (!isDraftBool) {
            const receiversArray = receivers ? [].concat(receivers) : [];
            
            // ✅ تجهيز مقتطف من المحتوى (أول 50 حرف مثلاً)
            const contentSnippet = content ? content.substring(0, 50) + "..." : "";

            for (const receiverId of receiversArray) {
                // 1. إدخال المستلم
                await TransData.insertReceiver(client, transId, receiverId);

                // 2. المسار
                const ReceiverUserDepData = await TransData.getUserDepartmentId(receiverId);
                if (ReceiverUserDepData) {
                    await TransData.insertTransactionPath(client, {
                        transId: transId,
                        fromDeptId: SenderUserDepId,
                        toDeptId: ReceiverUserDepData.department_id,
                        notes: 'وارد جديد'
                    });
                }

                // 3. ✅ إرسال الإشعار بالسوكيت (محدث)
                await TransData.createAndEmitNotification(client, {
                    userId: receiverId,    // لمين رايح
                    transId: transId,      // رقم المعاملة
                    senderName: senderName,// اسم المرسل (Dr. Ahmed)
                    subject: subject,      // عنوان المعاملة
                    snippet: contentSnippet // جزء من الرسالة
                }, io);
            }
        }

        await client.query('COMMIT'); 

        res.status(201).json({
            status: httpStatusText.SUCCESS,
            message: isDraftBool ? "تم حفظ المسودة بنجاح" : "تم إرسال المعاملة بنجاح",
            data: { 
                transaction_id: transId, 
                code: transCode ,
                attachments: files.map(file => ({
                    original_name: file.originalname,
                    file_path: file.filename 
                }))
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        return next(error);
    } finally {
        client.release();
    }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadAttachment = asyncWrapper(async (req, res, next) => {
    const filename = req.params.filename;
    
    // تحديد مسار الملف
    const filePath = path.join(__dirname, '../uploads/transactions', filename);

    // التأكد من وجود الملف
    if (!fs.existsSync(filePath)) {
        return next(appError.create("الملف غير موجود", 404, httpStatusText.FAIL));
    }

    // إرسال الملف (Download)
    res.download(filePath); 
    // أو لو عايزة تعرضيه في المتصفح (زي PDF) استخدمي:
    // res.sendFile(filePath);
});


export const getTransactionById = asyncWrapper(async (req, res, next) => {
    const transId = req.params.id; // الرقم جاي من الرابط

    // 1. جلب البيانات الأساسية
    const transactionInfo = await TransData.getTransactionDetailsById(transId);

    // لو المعاملة مش موجودة نرجع خطأ 404
    if (!transactionInfo) {
        const error = appError.create("المعاملة غير موجودة", 404, httpStatusText.FAIL);
        return next(error);
    }

    // 2. جلب المرفقات والسجل (بشكل متوازي لتسريع الأداء)
    const [attachments, history] = await Promise.all([
        TransData.getTransactionAttachments(transId),
        TransData.getTransactionHistory(transId)
    ]);

    // 3. تجميع البيانات في شكل منظم
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            details: transactionInfo,    // المعلومات الأساسية
            attachments: attachments,    // الملفات المرفقة
            history: history             // خط سير المعاملة
        }
    });
});