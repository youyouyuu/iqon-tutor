# BrightPath Academy

เว็บไซต์สถาบันเรียนพิเศษที่ออกแบบให้ใช้งานได้จริง พร้อมระบบรับข้อมูลผู้สนใจเรียนและหน้าแอดมินสำหรับติดตามรายการสมัคร

## Run Local

1. เปิด PowerShell ใน `C:\web`
2. ตั้งค่าบัญชีแอดมินก่อนรันระบบ:

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="change-this-password"
```

3. รันเซิร์ฟเวอร์:

```powershell
python server.py
```

4. เปิดใช้งาน:

```text
Website: http://127.0.0.1:8000
Admin:   http://127.0.0.1:8000/admin
Health:  http://127.0.0.1:8000/api/health
```

## What Is Included

- หน้าเว็บไซต์หลักสำหรับประชาสัมพันธ์สถาบัน
- ฟอร์มติดต่อที่ส่งข้อมูลเข้า backend ได้จริง
- ฐานข้อมูล SQLite ที่บันทึกรายการผู้สนใจเรียน
- Admin dashboard สำหรับดูข้อมูลล่าสุดและสถิติพื้นฐาน
- API health check สำหรับใช้ตรวจสถานะระบบ

## Data Storage

ฐานข้อมูลจะถูกสร้างอัตโนมัติที่:

```text
C:\web\data\brightpath.db
```

## Production Notes

- เปลี่ยน `ADMIN_PASSWORD` ก่อนนำระบบขึ้นใช้งานจริงทุกครั้ง
- หากต้องการออนไลน์จริง ควรวางระบบหลัง reverse proxy เช่น Nginx หรือบริการโฮสต์ที่รองรับ Python
- หากต้องการใช้งานระดับ production เต็มรูปแบบ ควรเพิ่ม HTTPS, backup ฐานข้อมูล, logging กลาง, และ authentication ที่แข็งแรงขึ้น

## Fastest Public Deployment

วิธีที่ง่ายที่สุดสำหรับให้คนอื่นกดลิงก์แล้วเข้าเห็นเว็บได้ คือ deploy ขึ้น Render

1. อัปโหลดโค้ดชุดนี้ขึ้น GitHub
2. สมัครหรือเข้าสู่ระบบ Render
3. สร้าง Web Service ใหม่จาก repo นี้
4. ตั้งค่า environment variable:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
5. Render จะสร้าง public URL ให้ในรูปแบบ `https://<your-service>.onrender.com`

ไฟล์ที่เตรียมไว้สำหรับ deploy แล้ว:

- `render.yaml`
- `Procfile`
- `requirements.txt`

## Files

- `index.html` หน้าเว็บไซต์หลัก
- `admin.html` หน้าแดชบอร์ดภายใน
- `styles.css` ชุดสไตล์ของทั้งเว็บไซต์และแอดมิน
- `script.js` การทำงานฝั่งผู้ใช้
- `admin.js` การทำงานฝั่งแอดมิน
- `server.py` เว็บเซิร์ฟเวอร์และ API
