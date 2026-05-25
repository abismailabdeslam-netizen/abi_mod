# 🛍️ متجر إلكتروني - Store App

## 🚀 النشر على Vercel + Supabase

### 1️⃣ إعداد Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وافتح مشروعك
2. اذهب إلى **Project Settings > Database > Connection string**
3. اختر **Transaction** (Port 6543) وانسخ الرابط
4. أضف كلمة المرور في الرابط مكان `[YOUR-PASSWORD]`

### 2️⃣ إنشاء الجداول في Supabase

في Supabase، اذهب إلى **SQL Editor** وشغّل:

```bash
# محلياً: أضف DATABASE_URL في ملف .env ثم شغّل:
npm install
npm run db:push
```

### 3️⃣ النشر على Vercel

1. ارفع المشروع على GitHub
2. اذهب إلى [vercel.com](https://vercel.com) وأنشئ مشروعاً جديداً
3. اختر الـ repo من GitHub
4. أضف متغيرات البيئة في Vercel:

```
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-xx.pooler.supabase.com:6543/postgres
APP_SECRET=any-strong-secret
```

5. اضغط **Deploy** ✅

### 🔑 متغيرات البيئة المطلوبة

| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | رابط Supabase PostgreSQL (Transaction pooler) |
| `APP_SECRET` | أي كلمة سر قوية للجلسات |

### 💻 التشغيل محلياً

```bash
npm install
cp .env.example .env
# عدّل .env وأضف DATABASE_URL
npm run db:push   # إنشاء الجداول
npm run dev       # تشغيل التطبيق
```
