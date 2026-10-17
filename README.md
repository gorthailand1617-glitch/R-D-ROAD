# ROAD Next-Gen · R&D Research Studio & AI Co-Pilot

> **Report Outline Assistant for Development & AI Research Studio**  
> ระบบออกแบบโครงร่างและเขียนรายงานการวิจัย 5 บท พร้อม AI Co-Pilot และเครื่องมือวิเคราะห์สถิติวิจัยทางการศึกษา สำหรับครู อาจารย์ ศึกษานิเทศก์ และนักวิจัย

---

## ✨ ไฮไลท์และฟีเจอร์เด่น (Key Features & R&D Methodology)

1. **Research Workspace & Lifecycle Engine (คลังโครงการวิจัยครบวงจร)**
   - จัดการโครงการวิจัยหลายโครงการพร้อมกัน ค้นหา กรองสถานะ และแสดงความคืบหน้าแบบเรียลไทม์
   - **6 สถานะโครงการมาตรฐาน**: `แบบร่าง (Draft)`, `กำลังเก็บข้อมูล (R1/D1)`, `สร้างโครงร่างแล้ว (Outlined)`, `กำลังตรวจความสอดคล้อง (Reviewing)`, `พร้อมส่งออกเล่ม 5 บท (Ready)`, และ `เก็บถาวร (Archived)`
   - ฟังก์ชันคัดลอกโครงการ (Duplicate), ปรับสถานะด่วน, และจัดเก็บเข้ากรุอย่างปลอดภัย

2. **Research Wizard 10 ขั้นตอน (สูตร รศ.ดร.ชวลิต ชูกำแพง)**
   - ตัวช่วยจัดทำโครงร่างวิจัยทีละสเต็ป พร้อมระบบ **Autosave** บันทึกข้อมูลอัตโนมัติทุกขั้นตอน:
     1. ชื่อเรื่องและคำสำคัญ (ABCD Pattern)
     2. สภาพปัญหาและบริบทสถานศึกษา
     3. วัตถุประสงค์การวิจัย 4 ระยะ
     4. สมมติฐานการวิจัย
     5. กลุ่มเป้าหมายและการสุ่มแบบกลุ่ม (Cluster Random Sampling)
     6. นวัตกรรมและขั้นตอนการจัดการเรียนรู้ (Syntax)
     7. เครื่องมือวิจัยและเกณฑ์คุณภาพ (IOC >= 0.50)
     8. แผนการวิเคราะห์ข้อมูลและสถิติทดสอบ
     9. ผลลัพธ์และประโยชน์ที่คาดว่าจะได้รับ
     10. ตรวจทานความสอดคล้องและสร้างเล่ม 5 บททันที
   - ปุ่ม **"✨ ตัวอย่างมาตรฐาน 1-Click"** เติมตัวอย่างงานวิจัยที่ถูกต้องตามหลักวิชาการในทุกขั้นตอน

3. **Review Center & 10 Pitfalls Validator (ศูนย์ตรวจความสอดคล้อง & แยกบท Word Export)**
   - เลย์เอาต์ 2 คอลัมน์สำหรับตัวแก้ไขบทวิจัย พร้อมแถบ Review Center ด้านขวา
   - ตรวจจับ **10 ข้อพึงระวังงานวิจัย R&D ตามเกณฑ์ อ.ชวลิต** (นวัตกรรมเชิงระบบ, E1/E2 สอดคล้อง, กลุ่มตัวอย่างระบุวิธีสุ่ม, ตัวแปรตามวัดได้จริง, สถิติตรงตามสมมติฐาน, นิยามศัพท์เฉพาะ, สังเคราะห์วรรณกรรม, แบบแผน R&D, ตาราง APA 3 เส้นหลัก, อภิปรายผลเทียบเคียงทฤษฎี)
   - **Chapter-by-Chapter Word Export**: ปุ่มดาวน์โหลดเอกสาร Word (.doc) แยกเฉพาะบทที่ต้องการ (บทที่ 1, 2, 3, 4, หรือ 5) นอกเหนือจากการส่งออกฉบับเต็ม 5 บท

4. **Security & Anti-Enumeration Password Reset Flow (`/forgot`)**
   - หน้ากู้คืนรหัสผ่านความปลอดภัยสูงแบบ **Anti-Enumeration** ไม่เปิดเผยการมีอยู่ของบัญชีในฐานข้อมูล
   - รองรับการยืนยันรหัส OTP 6 หลัก และการตั้งรหัสผ่านใหม่ที่ปลอดภัย

5. **Audit Trail & PDPA Consent Records (`/admin`)**
   - บันทึกกิจกรรมระบบและการเข้าถึงข้อมูล (Audit Logs): การเข้าสู่ระบบ, การสมัครสมาชิก, การสร้างโครงการ, การคำนวณสถิติ, และการส่งออกเอกสาร
   - ส่งออกบันทึก Audit Logs เป็นไฟล์ JSON สำหรับการตรวจสอบย้อนหลัง

6. **AI Research Advisor & ABCD Architecture**
   - **ABCD Pattern Architecture**: แยกแยะประเภทของนวัตกรรม (A), หลักการและทฤษฎีพื้นฐาน (B), ตัวแปรตามที่วัดได้จริง (C), และกลุ่มเป้าหมาย (D)
   - ทิศทางการวิจัยทางการศึกษาของชาติ พ.ศ. 2568–2570 และกรอบการประเมิน วPA 3 สายงาน

7. **Research StatLab Studio & EDURTAP Quality Engine (รศ.ดร.ญาณภัทร & รศ.ดร.ประเสริฐ)**
   - Statistical Decision Rules, IOC / IC Analyzer ($IOC \ge 0.50$), EDURTAP Test Item Analysis ($p, r, r_{tt}$), Cronbach's Alpha ($\alpha \ge 0.80$), Innovation Efficiency ($E_1/E_2, E.I.$), และ t-test Dependent Samples + Cohen's $d$

---

## 🎨 การออกแบบ (Design System)

- **3D Neumorphic Soft UI & Modern Glassmorphism**
- รองรับทั้ง **Light Mode** และ **Dark Mode** แบบไร้รอยต่อ
- Typography มาตรฐาน: Plus Jakarta Sans, IBM Plex Sans Thai, IBM Plex Mono และ Sarabun

---

## 🚀 การเริ่มต้นใช้งานในเครื่อง (Local Setup)

### วิธีที่ 1: รันผ่าน Batch script (แนะนำ)
ดับเบิลคลิกไฟล์:
```bat
start-road.bat
```

### วิธีที่ 2: รันผ่าน Node.js
```bash
# ติดตั้ง dependencies (โปรเจกต์ใช้ Built-in Node modules ทั้งหมด)
npm start
```
เปิดเบราว์เซอร์เข้าที่:
* **Studio**: [http://localhost:3080/app?welcome=1](http://localhost:3080/app?welcome=1)
* **Login**: [http://localhost:3080/login](http://localhost:3080/login)
* **Admin**: [http://localhost:3080/admin](http://localhost:3080/admin)

### วิธีที่ 3: เปิดตรงผ่านไฟล์ HTML (Offline / Standalone)
สามารถดับเบิลคลิกเปิดไฟล์ `index.html` บนเบราว์เซอร์ใดก็ได้โดยไม่ต้องรันเซิร์ฟเวอร์

---

## ☁️ การ Deploy บน Vercel

โปรเจกต์นี้ได้รับการตั้งค่า `vercel.json` สำหรับการ Deploy แบบ Static SPA เรียบร้อยแล้ว:
```bash
vercel deploy --prod
```
หรือเชื่อมต่อ repository นี้กับ Vercel Dashboard ได้ทันที

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── index.html          # โครงสร้างหน้าเว็บหลักและ Neumorphic Design System
├── server.js           # Local HTTP Server พร้อม Clean SPA Routing
├── vercel.json         # การตั้งค่า Rewrite routes สำหรับ Vercel
├── package.json        # การตั้งค่าโปรเจกต์และ Scripts
├── start-road.bat      # สคริปต์เปิดระบบแบบคลิกเดียวบน Windows
├── .gitignore          # ละเว้นไฟล์ที่ไม่จำเป็นในการ commit
└── js/
    ├── data.js         # ข้อมูลหลัก: จังหวัด, รุ่นอบรม, สมาชิกตัวอย่าง, พรีเซ็ตวิจัย
    ├── advisor.js      # AI Research Advisor & กฎการตัดสินใจเลือกโจทย์วิจัยที่ดีที่สุด
    ├── generator.js    # ระบบแยกส่วน ABCD, สร้างเมทริกซ์, สร้างพิมพ์เขียว 5 บท, Word Exporter
    └── app.js          # Logic แอปพลิเคชัน, จัดการ State, UI Views, StatLab Studio
```

---

## 📄 ลิขสิทธิ์
พัฒนาเพื่อสนับสนุนงานวิจัย นวัตกรรมการศึกษา และการพัฒนาวิชาชีพครู (วPA / R&D)
