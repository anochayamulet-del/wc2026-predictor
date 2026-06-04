# ⚽ WC2026 Predictor - ทายผลฟุตบอลโลก 2026

เว็บแอปสำหรับทายผลฟุตบอลโลก 2026 พร้อมระบบสมาชิก, ตารางคะแนน, และหน้า Admin

## ✨ Features

- 📝 สมัครสมาชิก / เข้าสู่ระบบ
- 📅 ตารางการแข่งขันรอบแบ่งกลุ่ม (72 แมตช์) พร้อมข้อมูลจริง
- 🎯 ทายผล (สกอร์) ก่อนแมตช์เริ่ม
- 🏆 ตารางคะแนน (Leaderboard)
- ⚙️ หน้า Admin สำหรับอัพเดทผลการแข่งขัน
- 🔄 คำนวณคะแนนอัตโนมัติเมื่อ Admin ใส่ผลแข่ง

## 📊 ระบบคะแนน

| ผลทาย | คะแนน |
|--------|--------|
| ทายผลแพ้/ชนะ/เสมอ ถูก | +3 คะแนน |
| ทายสกอร์ถูกต้อง (โบนัส) | +5 คะแนน |
| **สูงสุดต่อแมตช์** | **8 คะแนน** |

## 🚀 วิธีใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. Seed ข้อมูลการแข่งขัน

```bash
npm run seed
```

จะสร้าง:
- Admin user: `admin` / `admin123`
- ข้อมูลการแข่งขันรอบแบ่งกลุ่ม 72 แมตช์

### 3. เริ่มเซิร์ฟเวอร์

```bash
npm start
```

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt
- **Frontend**: HTML + Tailwind CSS + Vanilla JS

## 📁 โครงสร้างโปรเจกต์

```
wc2026-prediction/
├── server.js          # Express server
├── db.js              # Database setup & schema
├── seed.js            # Seed match data
├── package.json
├── middleware/
│   └── auth.js        # JWT authentication
├── routes/
│   ├── auth.js        # Login/Register
│   ├── matches.js     # Match listing
│   ├── predictions.js # User predictions
│   ├── admin.js       # Admin endpoints
│   └── leaderboard.js # Leaderboard
└── public/
    ├── index.html     # Frontend HTML
    └── app.js         # Frontend JavaScript
```

## 🔐 Admin Access

ใช้ username `admin` password `admin123` เพื่อเข้าหน้า Admin

ในหน้า Admin สามารถ:
- เปลี่ยนสถานะแมตช์ (รอแข่ง → LIVE → จบ)
- ใส่สกอร์ผลการแข่งขัน
- ระบบจะคำนวณคะแนนให้สมาชิกที่ทายผลอัตโนมัติ

## 🔄 ระบบอัพเดทผลอัตโนมัติ

ระบบจะตรวจสอบผลการแข่งขันจาก API ภายนอกทุก 5 นาที เมื่อมีแมตช์จบ จะ:
1. ดึงผลจาก API
2. อัพเดทสกอร์ในระบบ
3. คำนวณคะแนนให้สมาชิกที่ทายผลอัตโนมัติ

### ตั้งค่า API Key (เลือก 1 ตัว)

**ตัวเลือก 1: Football-Data.org (ฟรี)**
```bash
set FOOTBALL_API_KEY=your_api_key
npm start
```
สมัครฟรีที่: https://www.football-data.org/client/register

**ตัวเลือก 2: API-Football via RapidAPI**
```bash
set RAPIDAPI_KEY=your_rapidapi_key
npm start
```

> หากไม่ตั้ง API key ก็ยังสามารถใช้หน้า Admin อัพเดทผลเองได้ตามปกติ
