# ROAD Next-Gen · R&D Research Studio & AI Co-Pilot

> **Report Outline Assistant for Development & AI Research Studio**  
> ระบบออกแบบโครงร่างและเขียนรายงานการวิจัย 5 บท พร้อม AI Co-Pilot และเครื่องมือวิเคราะห์สถิติวิจัยทางการศึกษา สำหรับครู อาจารย์ ศึกษานิเทศก์ และนักวิจัย

---

## ✨ ไฮไลท์และฟีเจอร์เด่น (Key Features)

1. **AI Research Advisor & Best-Practice Engine**
   - วิเคราะห์และคัดสรรหัวข้อวิจัยตาม 11 กลุ่มสาระการเรียนรู้
   - จับคู่นวัตกรรม (B) และตัวแปรตาม (C) ให้สอดคล้องกับสภาพปัญหา (5 Pain Points)
   - แนะนำกรอบโมเดลการวิจัยที่เหมาะสมที่สุด (ADDIE, PAOR, R&D 4-Step) ตามเป้าหมายวิทยฐานะ วPA (คศ.1 – คศ.4) หรือวิทยานิพนธ์

2. **ABCD Research Architecture & Smart Title Decomposer**
   - ถอดรหัสและแยกส่วนชื่อเรื่องวิจัยอัตโนมัติ:
     - **A (Action)**: คำกริยาวิจัย เช่น *การพัฒนา*, *การวิจัยและพัฒนา*
     - **B (Treatment / Innovation)**: นวัตกรรมหรือตัวแปรต้น
     - **C (Outcomes)**: ตัวแปรตาม หรือผลลัพธ์ที่ต้องการยกระดับ
     - **D (Target Group)**: กลุ่มเป้าหมายและบริบท
   - ระบบ **Research Health Score** ตรวจเช็กความครบถ้วนสมบูรณ์ของโครงร่าง

3. **Research Alignment Matrix & 5-Chapter Blueprint Generator**
   - เมทริกซ์ความสอดคล้อง: วัตถุประสงค์ ↔ สมมติฐาน ↔ ตัวแปร ↔ เครื่องมือวิจัย ↔ สถิติ
   - สร้างโครงร่างรายงานการวิจัย 5 บทฉบับเต็ม พร้อมเนื้อหาตัวอย่าง ตารางสถิติ และกรอบแนวคิด
   - **Export to Word (.doc)**: ส่งออกเป็นเอกสาร Microsoft Word จัดหน้าและสไตล์แบบ Sarabun พร้อมพิมพ์

4. **Research StatLab Studio**
   - คำนวณหาค่าความสอดคล้องของผู้เชี่ยวชาญ (IOC)
   - คำนวณประสิทธิภาพนวัตกรรมกระบวนการ/ผลลัพธ์ ($E_1/E_2$)
   - คำนวณดัชนีประสิทธิผล (Effectiveness Index: E.I.)
   - วิเคราะห์สถิติทดสอบสมมติฐาน Dependent Samples $t$-test (Pre-test vs Post-test)
   - สรุปผลความพึงพอใจและสถิติพื้นฐาน ($\bar{X}$, S.D.)

5. **AI Co-Pilot Integration (Gemini Live API)**
   - Smart Prompt Builder สร้างพรอมต์เฉพาะทางสำหรับงานเขียนวิจัยแต่ละบท
   - รองรับการเชื่อมต่อกับ Google Gemini API โดยตรงจากหน้าเว็บ

6. **Cohort & Member Management**
   - ระบบลงทะเบียนและจัดกลุ่มสมาชิกตามรุ่นการอบรม (เช่น RD69A1)
   - หน้าแดชบอร์ด Admin สำหรับค้นหาและจัดการข้อมูลสมาชิก

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
