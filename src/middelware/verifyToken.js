import jwt from "jsonwebtoken";
import httpStatusText from "../utils/httpStatusText.js";
import appError from "../utils/appError.js";

export const verifyToken = (req, res, next) => {
    const authentication = req.headers['authorization'] || req.headers['Authorization'];

    if (!authentication) {
        const error = appError.create("Token is required", 401, httpStatusText.ERROR);
        return next(error);
    }

    // ✅ تأكد من وجود Bearer وازالتها بشكل صحيح
    const token = authentication.startsWith('Bearer ') 
        ? authentication.slice(7) 
        : authentication;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.currentUser = decoded;

        req.userId = decoded.id;
        req.currentUserRole = decoded.role.role_level;


        next();
    } catch (err) {
        console.log("❌ Token Error:", err.message);
        const error = appError.create("Invalid token", 401, httpStatusText.ERROR);
        return next(error);
    }
};
