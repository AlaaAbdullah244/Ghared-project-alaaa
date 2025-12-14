import { pool } from "../config/db.js";

// ========================== Colleges Data ==========================

export const getColleges = async () => {
  const query = `SELECT * FROM "College" ORDER BY college_id ASC`;
  const result = await pool.query(query);
  return result.rows;
};

export const createCollege = async (name) => {
  const query = `
    INSERT INTO "College" (college_name) 
    VALUES ($1) 
    RETURNING *
  `;
  const result = await pool.query(query, [name]);
  return result.rows[0];
};

export const updateCollegeData = async (id, name) => {
  const query = `
    UPDATE "College" 
    SET college_name = $2 
    WHERE college_id = $1 
    RETURNING *
  `;
  const result = await pool.query(query, [id, name]);
  return result.rows[0];
};


// ========================== Departments Data ==========================

export const getDepartments = async () => {
  const query = `
    SELECT 
      d.department_id,
      d.department_name,
      c.college_name,
      c.college_id
    FROM "Department" d
    LEFT JOIN "College" c ON d.college_id = c.college_id
    ORDER BY  d.department_id
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const createDepartment = async (name, collegeId) => {
  
  // =========================================================
  // اللوجيك الذكي هنا:
  // لو الـ collegeId له قيمة (يعني مش null ومش undefined) -> يبقى Level 2
  // لو ملوش قيمة -> يبقى Level 1
  // =========================================================
  const targetRoleLevel = collegeId ? 2 : 1; 

  const query = `
    WITH new_dep AS (
      INSERT INTO "Department" (department_name, college_id) -- شلنا department_type
      VALUES ($1, $2)
      RETURNING department_id, department_name, college_id
    )
    INSERT INTO "Department_Role" (department_id, role_id)
    SELECT 
      (SELECT department_id FROM new_dep),
      r.role_id
    FROM "Role" r
    WHERE r.role_level = $3  -- بنستخدم الليفل اللي حسبناه فوق
    LIMIT 1
    RETURNING (SELECT department_id FROM new_dep) as department_id; 
  `;
  
  // نمرر targetRoleLevel كـ parameter ثالث ($3)
  const result = await pool.query(query, [name, collegeId, targetRoleLevel]);
  
  // نرجع البيانات للفرونت عشان يتأكدوا
  return { 
     department_id: result.rows[0].department_id, 
     department_name: name, 
     college_id: collegeId,
     assigned_role_level: targetRoleLevel // دي زيادة عشان تشوفي هو اختار ايه
  };
};

export const updateDepartmentData = async (id, name, collegeId) => {
  const query = `
    UPDATE "Department"
    SET 
      department_name = COALESCE($2, department_name), -- لو الاسم مجاش، خلي القديم
      college_id = COALESCE($3, college_id)           -- لو الكلية مجتش، خلي القديمة (وعدلنا الرقم لـ 3)
    WHERE department_id = $1
    RETURNING *
  `;
  
  // المصفوفة فيها 3 عناصر، يبقى نستخدم $1, $2, $3
  const result = await pool.query(query, [id, name, collegeId]);
  return result.rows[0];
};



// ========================== Delete College Data ==========================

export const deleteCollegeData = async (colId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // تحديد كل الأقسام اللي جوه الكلية دي عشان نطبق عليها التنظيف
    const depSubQuery = `SELECT department_id FROM "Department" WHERE college_id = $1`;

    // 1️⃣ تنظيف الجداول المرتبطة بالأقسام (Transactions, Actions, Attachments)
    // بنخلي قيمة القسم NULL عشان نحافظ على سجل المعاملات بس نفك ارتباطه بالكلية المحذوفة
    
    

    // فك ارتباط مسار المعاملات
    await client.query(`UPDATE "Transaction_Path" SET from_department_id = NULL WHERE from_department_id IN (${depSubQuery})`, [colId]);
    await client.query(`UPDATE "Transaction_Path" SET to_department_id = NULL WHERE to_department_id IN (${depSubQuery})`, [colId]);

    // فك ارتباط الإجراءات
    await client.query(`UPDATE "Action" SET target_department_id = NULL WHERE target_department_id IN (${depSubQuery})`, [colId]);

    // فك ارتباط المرفقات
    await client.query(`UPDATE "Attachment" SET publishing_department_id = NULL WHERE publishing_department_id IN (${depSubQuery})`, [colId]);

    // 2️⃣ حذف العضويات (اليوزرس اللي جوه الأقسام دي)
    // ده بيمسح صلاحيات اليوزرس في الكلية دي، لكن حساب اليوزر الشخصي بيفضل موجود
    const deleteMembersQuery = `
      DELETE FROM "User_Membership"
      WHERE dep_role_id IN (
          SELECT dr.dep_role_id
          FROM "Department_Role" dr
          WHERE dr.department_id IN (${depSubQuery})
      )`;
    await client.query(deleteMembersQuery, [colId]);

    // 3️⃣ حذف أدوار الأقسام
    const deleteRolesQuery = `
      DELETE FROM "Department_Role"
      WHERE department_id IN (${depSubQuery})
    `;
    await client.query(deleteRolesQuery, [colId]);

    // 4️⃣ حذف الأقسام نفسها
    await client.query(`DELETE FROM "Department" WHERE college_id = $1`, [colId]);

    // 5️⃣ وأخيراً.. حذف الكلية
    const deleteColQuery = `DELETE FROM "College" WHERE college_id = $1 RETURNING *`;
    const result = await client.query(deleteColQuery, [colId]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};


// ========================== Delete Department Data ==========================

export const deleteDepartmentData = async (depId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1️⃣ فك ارتباط المعاملات والمسارات والمرفقات الخاصة بالقسم ده
    // بنستخدم SET NULL عشان مانمسحش تاريخ المعاملات القديمة
    
    
    await client.query(`UPDATE "Transaction_Path" SET from_department_id = NULL WHERE from_department_id = $1`, [depId]);
    await client.query(`UPDATE "Transaction_Path" SET to_department_id = NULL WHERE to_department_id = $1`, [depId]);

    await client.query(`UPDATE "Action" SET target_department_id = NULL WHERE target_department_id = $1`, [depId]);
    
    await client.query(`UPDATE "Attachment" SET publishing_department_id = NULL WHERE publishing_department_id = $1`, [depId]);

    // 2️⃣ حذف العضويات (User Memberships)
    // كده أي يوزر كان عنده صلاحية في القسم ده هتتشال منه
    const deleteMembersQuery = `
      DELETE FROM "User_Membership"
      WHERE dep_role_id IN (
          SELECT dep_role_id FROM "Department_Role" WHERE department_id = $1
      )`;
    await client.query(deleteMembersQuery, [depId]);

    // 3️⃣ حذف الأدوار (Roles) الخاصة بالقسم
    await client.query(`DELETE FROM "Department_Role" WHERE department_id = $1`, [depId]);

    // 4️⃣ حذف القسم نفسه
    const deleteDepQuery = `DELETE FROM "Department" WHERE department_id = $1 RETURNING *`;
    const result = await client.query(deleteDepQuery, [depId]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};


export const getDepartmentsByCollegeId = async (collegeId) => {
  const query = `
    SELECT 
      d.department_id,
      d.department_name,
      c.college_name,
      c.college_id
    FROM "Department" d
    JOIN "College" c ON d.college_id = c.college_id
    WHERE d.college_id = $1
    ORDER BY d.department_id ASC
  `;
  const result = await pool.query(query, [collegeId]);
  return result.rows;
};