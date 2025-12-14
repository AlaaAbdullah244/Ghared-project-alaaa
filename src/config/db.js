// // src/config/db.js
// import pg from "pg";
// import dotenv from "dotenv";
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // تحديد المسار الصحيح لملف .env (هذا جيد للتشغيل المحلي)
// dotenv.config({ path: path.join(__dirname, '../../.env') });

// const { Pool } = pg;

// // ** 💡 التغيير الأساسي هنا: استخدام رابط الاتصال الموحد (DATABASE_URL) **
// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL, // قراءة رابط Neon URL بالكامل
//   // لم تعد بحاجة لـ user, host, database, password, port
  
//   // إعدادات SSL لا تزال مطلوبة للاتصال بـ Neon
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

// pool
//   .connect()
//   .then(() => console.log("✅ Connected to PostgreSQL database"))
//   .catch((err) => console.error("❌ Database connection error:", err));


// src/config/db.js
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // ضروري لخدمات مثل Neon/Render
  }
});

// 🔥 الحل الجذري للمشكلة: معالجة أخطاء الاتصال الخاملة 🔥
// هذا يمنع التطبيق من التوقف (Crash) عند انقطاع الاتصال المفاجئ من جهة السيرفر
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  // لا تقم بإيقاف البرنامج هنا، فقط سجل الخطأ
});

// ملاحظة: قمنا بإزالة كود الاتصال التجريبي من هنا لأننا سنقوم به في server.js