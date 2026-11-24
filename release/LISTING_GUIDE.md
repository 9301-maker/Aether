# คู่มือวางเล่นและวางขายจริง (ทำตามทีละข้อ ไม่ต้องเขียนโค้ดเพิ่ม)

ไฟล์ทั้งหมดที่เตรียมไว้ให้คุณอยู่ในโฟลเดอร์ `release/` แล้วครับ:
- `release/aether-horizon-playable.zip` — ตัวเกมพร้อมเล่นบนเว็บ (อัปโหลดขึ้น itch.io ได้ทันที)
- `release/aether-horizon-source.zip` — ซอร์สโค้ดฉบับสมบูรณ์สำหรับขายเป็น Template (React + TypeScript + Three.js)
- `release/screenshots/` — รูปภาพตัวอย่าง 4 รูป พร้อมใช้อัปโหลดเป็นหน้าปกและแกลเลอรี

---

## ขั้นตอนที่ 1: เปิดหน้าเล่นฟรี + ขายซอร์สโค้ดบน itch.io (แนะนำที่สุด)

1. ไปที่ **https://itch.io** และสมัคร/เข้าสู่ระบบ (ใช้บัญชี Google ได้)
2. กดเมนูมุมขวาบน **Dashboard** -> **Create new project**
3. กรอกข้อมูลพื้นฐาน (ก๊อปด้านล่างไปวางได้เลย):
   - **Title:** `AETHER HORIZON: DIMENSIONAL SHIFT`
   - **Kind of project:** เลือก **HTML**
   - **Pricing:** เลือก **Free or Donate** (ถ้าอยากเปิดให้คนเล่นฟรีและรับทิป) หรือเลือก **Paid** ตั้งราคา เช่น `$8.00` หากต้องการขายโค้ด/ตัวเกม
   - **Uploads (อัปโหลดไฟล์):**
     - กด **Upload files** -> เลือก `aether-horizon-playable.zip` -> **ติ๊กถูก** ช่อง `This file will be played in the browser`
     - (ถ้าขายซอร์สโค้ดด้วย) กด **Upload files** อีกอัน -> เลือก `aether-horizon-source.zip` -> **ไม่ติ๊ก** เล่นในเบราว์เซอร์ (ตั้งราคาในช่องไฟล์หรือรวมเป็นแพ็กขาย)
   - **Embed options:**
     - **Viewport dimensions:** `1280` x `720`
     - ติ๊ก **Mobile friendly** และ **Fullscreen button**
   - **Cover image & Screenshots:** อัปโหลดรูปจากโฟลเดอร์ `release/screenshots/`
4. ตั้งค่ารับเงินใน **Account Settings -> Payouts** (เชื่อมต่อ **PayPal** หรือ **Stripe**)
5. เลื่อนลงล่างสุด เลือก **Public** แล้วกด **Save & view page**

---

## ขั้นตอนที่ 2: ข้อความพร้อมก๊อปไปวางขาย / โปรโมต

### ภาษาอังกฤษ (สำหรับ itch.io / Gumroad / Reddit)

**Short Tagline:**
> Endless 3D Action Racing & Flight Web Game across Ground, Sky, and Space — 200 Vehicles, 20 Dimensions & Boss Battles.

**Description (Copy & Paste):**
```text
AETHER HORIZON: DIMENSIONAL SHIFT is a fast-paced 3D Endless Action Racing & Flight game built with React, TypeScript, Tailwind CSS, and Three.js.

KEY FEATURES:
- 3 Altitude Layers: Race on the Ground, soar through the Sky, or boost into Space seamlessly.
- 200 Unlockable Vehicles: Cars, Aircraft, Spaceships & Hybrids with 8 distinct weapon patterns.
- 20 Playable Dimensions: Volcanic Caldera (with erupting magma boulders & lava fissures), Quantum Rift (dimensional portals & rift hazards), Crystal Sanctuary, Cyber Neon District, Pyramid Desert, Sakura Shrine, and more.
- Interactive 3D Garage & Upgrades: Rotate/zoom vehicles in a real-time 3D showroom and upgrade Top Speed, Armor, Magnet & Weapon Power.
- Boss Battles & Route Selection: Pick your next dimensional portal mid-run and battle multi-phase bosses.
- 100% Client-Side & Mobile Ready: Responsive controls for Desktop keyboard + Touch swipe/buttons.

CONTROLS:
- A / D or Left / Right (or Swipe): Switch Lanes
- W / Up (or Swipe Up): Jump / Double Jump
- S / Down (or Swipe Down): Crouch / Fast Fall
- Space: Fire Weapons (or toggle Auto-Fire)
- Shift: Overdrive Boost
- 1 / 2 / 3: Switch Altitude (Ground / Sky / Space)

SOURCE CODE TEMPLATE INCLUDED (optional):
Clean modular React 19 + TypeScript + Three.js codebase with portable relative Vite build (works on itch.io, Cloudflare Pages, Netlify, Vercel, and GitHub Pages).
```

**Tags (สำหรับ itch.io):**
`3d`, `racing`, `endless-runner`, `threejs`, `action`, `sci-fi`, `flight`, `browser`

---

### ภาษาไทย (สำหรับโพสต์รับงานบน Fastwork / กลุ่ม Dev / Facebook)

```text
รับทำเว็บเกม 3D / หน้าเว็บโชว์สินค้า 3 มิติ (Three.js + React)
ตัวอย่างผลงานจริงที่กดเล่นได้ทันที: [วางลิงก์ Shared App URL หรือลิงก์ itch.io ของคุณ]

ความสามารถที่ทำได้:
- เกม 3 มิติบนเว็บ (เล่นได้ทั้งคอมและมือถือ ไม่ต้องโหลดแอป)
- หน้าเว็บ 3D Showroom หมุนซูมดูสินค้า/โมเดลได้จริง
- ระบบสะสมแต้ม เหรียญ อัปเกรด และมินิเกมโปรโมตแคมเปญร้านค้า
สนใจทักคุยสเปกและงบประมาณได้ครับ (เริ่มต้นหลักพัน คุยง่าย ส่งงานไว)
```
