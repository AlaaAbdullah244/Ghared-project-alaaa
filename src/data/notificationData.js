// import { pool } from "../config/db.js"; 

// // 1. جلب القائمة
// // 1. جلب القائمة
// export const GetNotificationData = async (userId) => {
//     const query = `
//         SELECT 
//             n.notification_id,
//             n.is_read,
//             t."date" as start_date,         -- 👈 اخذنا التاريخ من جدول المعاملة وسميناه start_date عشان الفرونت إند
//             t.subject,
//             SUBSTRING(t.content, 1, 50) AS message_snippet,
//             u.full_name AS sender_name
//         FROM "Notification" n
//         JOIN "Transaction" t ON n.transaction_id = t.transaction_id
//         JOIN "User" u ON t.sender_user_id = u.user_id
//         WHERE n.user_id = $1 
//         ORDER BY t."date" DESC              -- 👈 الترتيب حسب تاريخ المعاملة
//     `;
    
//     const { rows } = await pool.query(query, [userId]);
//     return rows;
// };
// // 2. جلب عدد غير المقروء
// export const GetUnreadCount = async (userId) => {
//     const query = `
//         SELECT COUNT(*) as count 
//         FROM "Notification"                  -- 👈 وهنا أيضاً
//         WHERE user_id = $1 AND is_read = false
//     `;
    
//     const { rows } = await pool.query(query, [userId]);
//     // التأكد من أن القيمة رقم (Postgres تُرجع COUNT كنص أحياناً)
//     return parseInt(rows[0].count, 10); 
// };

// // 3. تحديث حالة القراءة
// export const updateNotificationReadStatus = async (notificationId, userId) => {
//     const query = `
//         UPDATE "Notification"                -- 👈 وهنا أيضاً
//         SET is_read = true 
//         WHERE notification_id = $1 AND user_id = $2
//     `;

//     const result = await pool.query(query, [notificationId, userId]);
//     return result.rowCount > 0;
// };


import { pool } from "../config/db.js"; 

// 1. جلب القائمة مع Pagination
export const GetNotificationData = async (userId, limit, offset) => {
    const query = `
        SELECT 
            n.notification_id,
            n.is_read,
            t."date" as "date",                    -- تم توحيد الاسم ليكون date
            t.subject,
            SUBSTRING(t.content, 1, 50) AS "messageSnippet", -- تم التوحيد (camelCase)
            u.full_name AS "senderName"            -- تم التوحيد (camelCase)
        FROM "Notification" n
        JOIN "Transaction" t ON n.transaction_id = t.transaction_id
        JOIN "User" u ON t.sender_user_id = u.user_id
        WHERE n.user_id = $1 
        ORDER BY t."date" DESC
        LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(query, [userId, limit, offset]);
    return rows;
};

// 2. جلب إجمالي عدد الإشعارات (لحساب عدد الصفحات)
export const GetTotalNotificationsCount = async (userId) => {
    const query = `SELECT COUNT(*) as count FROM "Notification" WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count, 10);
};

// 3. جلب عدد الإشعارات غير المقروءة (للجرس الأحمر)
export const GetUnreadCount = async (userId) => {
    const query = `
        SELECT COUNT(*) as count 
        FROM "Notification"
        WHERE user_id = $1 AND is_read = false
    `;
    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count, 10); 
};

// 4. تحديث حالة القراءة
export const updateNotificationReadStatus = async (notificationId, userId) => {
    const query = `
        UPDATE "Notification"
        SET is_read = true 
        WHERE notification_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rowCount > 0;
};