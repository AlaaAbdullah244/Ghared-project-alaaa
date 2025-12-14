// import asyncWrapper from "../middelware/asyncwraper.js";
// import httpStatusText from "../utils/httpStatusText.js";
// import appError from "../utils/appError.js";
// // لاحظي: استدعينا دالة جديدة اسمها GetUnreadCount
// import { GetNotificationData, GetUnreadCount ,updateNotificationReadStatus} from "../data/notificationData.js"; 

// export const getNotification = asyncWrapper(async (req, res, next) => {

//     const userId = req.userId;

//     // ✅ التأكد من وجود userId
//     if (!userId) {
//         const error = appError.create(
//             "معرّف المستخدم مطلوب",
//             400,
//             httpStatusText.FAIL
//         );
//         return next(error);
//     }

//     // ✅ تنفيذ العمليتين معاً (جلب القائمة + جلب العدد)
//     // استخدمنا await مرة واحدة عشان نضمن ان الداتا جت
//     const notifications = await GetNotificationData(userId);
//     const unreadCount = await GetUnreadCount(userId);

//     // ✅ الرد النهائي (Response)
//     return res.status(200).json({
//         status: httpStatusText.SUCCESS, // "success"
//         message: "تم جلب الإشعارات بنجاح",
//         data: {
//             unreadCount: unreadCount,    // العداد الأحمر (مثال: 5)
//             notifications: notifications // قائمة الإشعارات نفسها
//         }
//     });

// });



// export const markAsRead = asyncWrapper(async (req, res, next) => {
    
//     // 1. استخراج البيانات
//     const notificationId = req.params.id; // جاي من الرابط /:id
//     const userId = req.userId;            // جاي من التوكن (للحماية)

//     // 2. استدعاء دالة التحديث
//     const isUpdated = await updateNotificationReadStatus(notificationId, userId);

//     // 3. التحقق من النتيجة
//     if (!isUpdated) {
//         // لو مفيش حاجة اتعدلت، ده معناه ان الاشعار مش موجود او مش بتاع اليوزر
//         const error = appError.create(
//             "الإشعار غير موجود أو لا تملك صلاحية تعديله",
//             404,
//             httpStatusText.FAIL
//         );
//         return next(error);
//     }

//     // 4. الرد بنجاح
//     return res.status(200).json({
//         status: httpStatusText.SUCCESS,
//         message: "تم تحديث حالة الإشعار إلى مقروء",
//         data: null 
//     });
// });

import asyncWrapper from "../middelware/asyncwraper.js";
import httpStatusText from "../utils/httpStatusText.js";
import appError from "../utils/appError.js";
import { 
    GetNotificationData, 
    GetUnreadCount, 
    updateNotificationReadStatus, 
    GetTotalNotificationsCount 
} from "../data/notificationData.js"; 

export const getNotification = asyncWrapper(async (req, res, next) => {
    const userId = req.userId;

    if (!userId) {
        const error = appError.create("معرّف المستخدم مطلوب", 400, httpStatusText.FAIL);
        return next(error);
    }

    // 1. إعدادات الـ Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 2. جلب البيانات بالتوازي لتقليل وقت الانتظار
    const [notifications, unreadCount, totalNotifications] = await Promise.all([
        GetNotificationData(userId, limit, offset),
        GetUnreadCount(userId),
        GetTotalNotificationsCount(userId)
    ]);

    // 3. حساب عدد الصفحات الكلي
    const totalPages = Math.ceil(totalNotifications / limit);

    // 4. الرد النهائي
    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "تم جلب الإشعارات بنجاح",
        data: {
            unreadCount: unreadCount,
            notifications: notifications,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalNotifications,
                itemsPerPage: limit
            }
        }
    });
});

export const markAsRead = asyncWrapper(async (req, res, next) => {
    const notificationId = req.params.id; 
    const userId = req.userId;            

    const isUpdated = await updateNotificationReadStatus(notificationId, userId);

    if (!isUpdated) {
        const error = appError.create(
            "الإشعار غير موجود أو لا تملك صلاحية تعديله",
            404,
            httpStatusText.FAIL
        );
        return next(error);
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "تم تحديث حالة الإشعار إلى مقروء",
        data: null 
    });
});