import appError from "../utils/appError.js";

// Manual validation middleware for transactions.
// This approach is used because express-validator's isArray() check
// is too strict for multipart/form-data, which sends single values as strings, not arrays.
export const validateTransaction = (req, res, next) => {
    const { 
        content, 
        is_draft, 
        receivers 
    } = req.body;

    // 1. Validate that content exists and is not empty.
    if (!content || content.trim() === "") {
        return next(appError.create("محتوى المعاملة مطلوب", 400));
    }

    // 2. For non-drafts, validate that at least one receiver is present.
    const isDraftBool = (is_draft === true || is_draft === 'true');
    
    if (!isDraftBool) {
        // This check handles cases where receivers is undefined, null, an empty string, OR an empty array.
        if (!receivers || receivers.length === 0) {
            return next(appError.create("يجب اختيار مستلم واحد على الأقل للإرسال", 400));
        }
    }

    // All checks passed.
    next();
};
