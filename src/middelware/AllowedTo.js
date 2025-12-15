import appError from "../utils/appError.js";

// ✅ تم تغييرها لـ Named Export عشان تتوافق مع طريقة الاستدعاء في الـ Routes
export const allowedTo = (...roles) => {    
    return (req, res, next) => {
        // حماية إضافية: التأكد الأول إن التوكن سليم وبيانات اليوزر موجودة
        if (!req.currentUser) {
            return next(appError.create('الرجاء تسجيل الدخول أولاً', 401));
        }

        // مقارنة الصلاحيات
        if(!roles.includes(req.currentUser.role)) {
            return next(appError.create('ليس لديك الصلاحية لإضافة مسؤول', 403)); // 403 أنسب للصلاحيات
        }
        next();
    }
}