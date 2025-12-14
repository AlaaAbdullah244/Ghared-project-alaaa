import asyncWrapper from "../middelware/asyncwraper.js";
import * as OrgData from "../data/OrganizationData.js";
import httpStatusText from "../utils/httpStatusText.js";
import appError from "../utils/appError.js";
import { validationResult } from "express-validator";

// ========================== Colleges (الكليات) ==========================

export const getAllColleges = asyncWrapper(async (req, res, next) => {
  const colleges = await OrgData.getColleges();
  
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: colleges.length,
    data: { colleges }
  });
});

export const addCollege = asyncWrapper(async (req, res, next) => {
  const { collegeName } = req.body;

  if (!collegeName) {
    const error = appError.create("يجب إدخال اسم الكلية", 400, httpStatusText.FAIL);
    return next(error);
  }

  const newCollege = await OrgData.createCollege(collegeName);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "تم إضافة الكلية بنجاح",
    data: { college: newCollege }
  });
});

export const updateCollege = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { collegeName } = req.body;

  const updatedCollege = await OrgData.updateCollegeData(id, collegeName);

  if (!updatedCollege) {
    return next(appError.create("الكلية غير موجودة", 404, httpStatusText.FAIL));
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "تم تعديل اسم الكلية بنجاح",
    data: { college: updatedCollege }
  });
});

export const deleteCollege = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  // التحقق مما إذا كانت الكلية مرتبطة بأقسام (يمكن إضافته هنا أو الاعتماد على SQL Constraint Error)
  const deleted = await OrgData.deleteCollegeData(id);

  if (!deleted) {
    return next(appError.create("الكلية غير موجودة", 404, httpStatusText.FAIL));
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "تم حذف الكلية بنجاح"
  });
});

// ========================== Departments (الأقسام) ==========================

export const getAllDepartments = asyncWrapper(async (req, res, next) => {
  const departments = await OrgData.getDepartments();
  
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: departments.length,
    data: { departments }
  });
});

export const addDepartment = asyncWrapper(async (req, res, next) => {
  // 1. استقبال roleId مع باقي البيانات
  const { departmentName, collegeId, roleId } = req.body;

  // 2. التحقق من الإدخال
  if (!departmentName || !roleId) {
    const error = appError.create("يجب إدخال اسم القسم ورقم الصلاحية (Role ID)", 400, httpStatusText.FAIL);
    return next(error);
  }

  // 3. تمرير roleId للدالة في طبقة الداتا
  const newDep = await OrgData.createDepartment(departmentName, collegeId, roleId);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "تم إضافة القسم وتعيين الصلاحية المحددة بنجاح",
    data: { department: newDep }
  });
});


export const updateDepartment = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { departmentName, collegeId } = req.body;

  const updatedDep = await OrgData.updateDepartmentData(id, departmentName, collegeId);

  if (!updatedDep) {
    return next(appError.create("القسم غير موجود", 404, httpStatusText.FAIL));
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "تم تحديث بيانات القسم بنجاح",
    data: { department: updatedDep }
  });
});

export const deleteDepartment = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const deleted = await OrgData.deleteDepartmentData(id);

  if (!deleted) {
    return next(appError.create("القسم غير موجود", 404, httpStatusText.FAIL));
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "تم حذف القسم وصلاحياته بنجاح"
  });
});

export const getCollegeDepartments = asyncWrapper(async (req, res, next) => {
  const { id } = req.params; // هنا id هو رقم الكلية

  const departments = await OrgData.getDepartmentsByCollegeId(id);
  
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: departments.length,
    data: { departments }
  });
});