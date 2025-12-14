import express from 'express';
import { 
    getAllColleges, 
    addCollege, 
    updateCollege, 
    deleteCollege,
    getAllDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getCollegeDepartments
} from '../controllers/OrganizationController.js'; 

import { allowedTo } from '../middelware/AllowedTo.js'; 
import UserRoles from '../utils/UserRoles.js'; 
import { verifyToken } from "../middelware/verifyToken.js";

const router = express.Router();

// جميع العمليات تتطلب أن يكون المستخدم "أدمن" (Level 0)

// ================== Colleges Routes ==================
router.route('/colleges')
    .get(verifyToken, allowedTo(UserRoles.ADMIN), getAllColleges)
    .post(verifyToken, allowedTo(UserRoles.ADMIN), addCollege);

router.route('/colleges/:id')
    .put(verifyToken, allowedTo(UserRoles.ADMIN), updateCollege)
    .delete(verifyToken, allowedTo(UserRoles.ADMIN), deleteCollege);

// ================== Departments Routes ==================
router.route('/departments')
    .get(verifyToken, allowedTo(UserRoles.ADMIN), getAllDepartments)
    .post(verifyToken, allowedTo(UserRoles.ADMIN), addDepartment);

router.route('/departments/:id')
    .put(verifyToken, allowedTo(UserRoles.ADMIN), updateDepartment)
    .delete(verifyToken, allowedTo(UserRoles.ADMIN), deleteDepartment);

    // هذا الرابط معناه: هات لي أقسام الكلية رقم :id
router.get(
    "/colleges/:id/departments", 
    verifyToken, 
    allowedTo(UserRoles.ADMIN), 
    getCollegeDepartments
);

export default router;