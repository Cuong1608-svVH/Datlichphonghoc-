# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** UniStudy - Realtime Study Room Booking & Concurrency Conflict Resolution  
**Team / Student Name:** Nguyen Van Cuong  
**Submission Date:** 05/10/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Nguyen Van Cuong — Student ID: 23IT.B021 — Role: Fullstack Architecture & Mobile Development — Contribution: 100%
* **🔗 Live Demo URL (GitHub Pages):** [https://cuong1608-svvh.github.io/StudyBooking-/](https://cuong1608-svvh.github.io/StudyBooking-/)
* **💻 GitHub Repository:** [https://github.com/Cuong1608-svVH/StudyBooking-](https://github.com/Cuong1608-svVH/StudyBooking-)
* **📱 Mobile App (Expo Metro):** Tested on physical iPhone via Expo Go (`--tunnel` mode)
* **🎥 Video Demo (Optional):** [Sẵn sàng trình chiếu trực tiếp trên máy và điện thoại]

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | **Multi-Platform Parity (Web & Mobile)** | ✅ Complete | Web React (Vite, TypeScript, Tailwind/CSS System) & Mobile App (React Native Expo, Bottom Tabs, Touch Gestures). |
| 2 | **Room Discovery & Multi-Param Filtering** | ✅ Complete | Filter by Date, Fixed Time Slots (Ca 1–6), Floors (Tầng 1–3), Capacity (Small, Medium, Large, Hall), and Keyword Search. |
| 3 | **Level 2 Concurrency Conflict Resolution** | ✅ Complete | SQLite ACID Transaction + Partial Unique Index (`room_id, booking_date, slot_id WHERE status='CONFIRMED'`). HTTP 201 vs 409 Protocol. |
| 4 | **Realtime WebSocket Synchronization** | ✅ Complete | Socket.io event `ROOM_STATUS_CHANGED` broadcasts instantaneous room state changes across Web & Mobile without page refresh. |
| 5 | **Strict Business Rule Enforcement** | ✅ Complete | Max 3 slots per student per day rule; 3-Hour pre-slot cancellation window constraint strictly calculated and enforced. |
| 6 | **Admin Management Dashboard** | ✅ Complete | Realtime KPI Metrics, Room CRUD (Create, Update, Maintenance mode toggle, Delete), and campus-wide booking management. |
| 7 | **Authentication & Student Profile** | ✅ Complete | JWT Authentication, manual Student/Admin registration, profile management, and segmented booking history (Upcoming/Past/Cancelled). |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1. Architectural Overview
The system follows a modern decoupled, multi-tier fullstack architecture designed for real-time consistency, cross-platform compatibility, and resilient network traversal:

```
┌──────────────────────────────────────────────┐     ┌──────────────────────────────────────────────┐
│             Web Client (React)               │     │           Mobile Client (Expo)               │
│  - React 18 + TypeScript + Vite SPA          │     │  - React Native + TypeScript + Expo Go       │
│  - Hosted on GitHub Pages (HTTPS)            │     │  - Physical iPhone / Android via Tunnel      │
└───────────────────────┬──────────────────────┘     └──────────────────────┬───────────────────────┘
                        │ HTTP / WebSocket                                  │ HTTP / WebSocket
                        ▼                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Tunnel (High-Speed HKG Datacenter)                             │
│                  TLS 1.3 Termination, Zero Rate-Limits, Full WebSocket Upgrade                    │
└──────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                   │ Proxy Forward
                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           Backend Service (Node.js & Express)                                     │
│  - RESTful API Controller Layer (`/api/auth`, `/api/rooms`, `/api/bookings`, `/api/stats`)         │
│  - Realtime Hub: Socket.io Server (Bi-directional room state broadcasting)                         │
│  - Middleware: JWT Token Verification, Role-Based Access Control (STUDENT / ADMIN)                │
└──────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                   │ Synchronous Engine
                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     Database Layer: SQLite3 (WAL Mode & ACID Engine)                              │
│  - Write-Ahead Logging (WAL) for High Concurrent Reads & Isolated Serialized Writes               │
│  - Partial Unique Index Constraint on active bookings                                            │
│  - Foreign Keys & Referential Integrity Constraints                                              │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Project Directory Organization
```
d:/Danentang/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD GitHub Actions workflow for automatic Pages deployment
├── client/                         # Web Client (React + TypeScript + Vite)
│   ├── public/                     # Static assets & icons
│   ├── src/
│   │   ├── components/             # Reusable UI (RoomCard, FilterBar, BookingModal, Navbar, Toast)
│   │   ├── context/                # Global State (AuthContext, SocketContext)
│   │   ├── pages/                  # HomePage, ProfilePage, AdminDashboardPage
│   │   ├── services/               # Typed API Client & dynamic base URL resolver
│   │   └── index.css               # Design System tokens, animations & responsive styles
│   └── vite.config.ts              # Vite config with relative base (`./`) for GitHub Pages
├── mobile/                         # Mobile App (React Native Expo)
│   ├── src/
│   │   ├── api/                    # Dynamic client with Cloudflare tunnel & manual IP override
│   │   ├── components/             # Native RoomCard, BookingModal, DateSelector, SlotSelector
│   │   ├── context/                # Mobile AuthContext, SocketContext (WebSocket + Polling)
│   │   ├── navigation/             # AppNavigator (Bottom Tabs Navigation)
│   │   ├── screens/                # HomeScreen, HistoryScreen, ProfileScreen, AdminScreen
│   │   └── styles/theme.ts         # Centralized Design Tokens (colors, radius, spacing)
│   └── app.json                    # Expo configuration & scheme
├── server/                         # Backend Service (Node.js + Express + SQLite3)
│   ├── src/
│   │   ├── controllers/            # authController, bookingController, roomController, statsController
│   │   ├── middleware/             # auth.js (JWT authentication & admin role guard)
│   │   ├── routes/                 # Express API routes
│   │   ├── socket/                 # socketHandler.js (WebSocket rooms & broadcast dispatch)
│   │   ├── db.js                   # SQLite connection, WAL mode setup, schema initialization
│   │   ├── index.js                # Server entry point & Socket.io initialization
│   │   └── seed.js                 # Realistic seed data generator (rooms, slots, sample accounts)
│   └── package.json
├── scratch/
│   └── test_concurrency.js         # Automated high-concurrency clash test suite (Promise.all)
├── .gitignore                      # Exclusion rules (node_modules, cloudflared.exe, *.db)
└── README.md                       # Comprehensive deployment & test documentation
```

### 3.3. State Management & Concurrency Resolution Flow
1. **Isolated ACID Booking Transaction:**
   ```javascript
   // Atomic Concurrency Guard in bookingController.js
   const runBookingTransaction = db.transaction((userId, roomId, date, slotId, notes) => {
     // 1. Enforce student max 3 slots / day rule
     const count = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE user_id = ? AND booking_date = ? AND status = 'CONFIRMED'`).get(userId, date);
     if (count.c >= 3) throw new Error('LIMIT_EXCEEDED');

     // 2. Insert booking (Protected by UNIQUE INDEX)
     const info = db.prepare(`INSERT INTO bookings (user_id, room_id, booking_date, slot_id, notes) VALUES (?, ?, ?, ?, ?)`).run(...);
     return info.lastInsertRowid;
   });
   ```
2. **Conflict Trapping & HTTP Protocol:**
   - If User A and User B request the same room slot simultaneously, User A commits successfully (`HTTP 201 Created`).
   - SQLite unique index violation throws `SQLITE_CONSTRAINT_UNIQUE`, which the controller catches and transforms into `HTTP 409 Conflict` with a user-friendly message: *"Phòng này vừa được người khác đặt trước bạn vài phần trăm giây"*.
3. **Instant Global Synchronization:**
   - On successful transaction commit, `io.emit('ROOM_STATUS_CHANGED', { action: 'BOOKED', roomId, bookingDate, slotId })` is dispatched.
   - All connected Web and Mobile clients listen to this event and instantly freeze/update the corresponding slot without requiring manual reload.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

### Screenshot 1: Web Interface & Real-time Room Explorer (Desktop)
* **Location:** `client/src/pages/HomePage.tsx`
* **Evidence:** Shows dynamic filtering bar (Date selector, Time slots Ca 1–6, Floor, Capacity, Search keyword) alongside live status badges (*Sẵn sàng*, *Đã đặt*, *Đang bảo trì*).
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏫 UniStudy     [Đặt Phòng]   [Lịch Sử]   [Quản Trị]      [Nguyễn Văn An (SV20240101)] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [📅 Chọn ngày: 2026-10-05]   [Ca 1: 07:30 - 09:30]  [Ca 2]  [Ca 3] ...                 │
│ [🏢 Tầng: Tất cả]   [👥 Sức chứa: 5-8 người]   [🔍 Tìm kiếm phòng...]   [🔘 Chỉ phòng trống] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│ │ P.101 - Thảo Luận Alpha │  │ P.102 - Sáng Tạo Beta   │  │ P.103 - Nghiên Cứu 1    │  │
│ │ 🟢 SẴN SÀNG             │  │ 🔴 ĐÃ ĐƯỢC ĐẶT          │  │ 🟢 SẴN SÀNG             │  │
│ │ Tầng 1 • 4 chỗ ngồi     │  │ Tầng 1 • 8 chỗ ngồi     │  │ Tầng 1 • 6 chỗ ngồi     │  │
│ │ [ Đặt Phòng Ngay ]      │  │ [ Đã Kín Chỗ ]          │  │ [ Đặt Phòng Ngay ]      │  │
│ └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Screenshot 2: Mobile Interface on Physical iPhone (Expo Go)
* **Location:** `mobile/src/screens/HomeScreen.tsx` & `ProfileScreen.tsx`
* **Evidence:** Physical device running via Expo Tunnel, featuring 4 bottom navigation tabs (*Đặt phòng, Lịch sử, Cá nhân, Quản trị*), native touch interactions, and the **Cloudflare Backend Ping diagnostic widget** reporting `🟢 Kết nối tốt (~28ms)`.
```
┌───────────────────────────┐
│ 9:41                      │
│ 🏫 UniStudy Mobile        │
├───────────────────────────┤
│ 📅 Hôm nay: 05/10/2026    │
│ 🕒 [Ca 1] [Ca 2] [Ca 3]   │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ P.102 - Sáng Tạo Beta │ │
│ │ 🟢 Còn trống • Tầng 1 │ │
│ │ 👥 Sức chứa: 8 người  │ │
│ │ [ Đặt phòng ngay ]    │ │
│ └───────────────────────┘ │
├───────────────────────────┤
│ ⚙️ Máy chủ: Cloudflare    │
│ 🟢 Kết nối tốt (28ms)     │
├───────────────────────────┤
│ [🏠]   [📋]   [👤]   [🛡️] │
│ Đặt   Lịch   Tôi   Admin  │
└───────────────────────────┘
```

### Screenshot 3: Automated Concurrency Clash Test Execution
* **Location:** `scratch/test_concurrency.js`
* **Evidence:** Proves 100% data integrity when 2 asynchronous promises fire simultaneously for Room 1, Slot 3 on the same date.
```
======================================================================
TEST 1: HAI SINH VIEN TRANH NHAU 1 PHONG CUNG 1 GIAY (RACE CONDITION)
======================================================================
[Simultaneous Requests Triggered at timestamp: 2026-10-05T06:55:00.120Z]
>> Sinh vien A: HTTP 201 Created -> "Dat phong thanh cong!" (Booking ID: 15)
>> Sinh vien B: HTTP 409 Conflict -> "Phong nay vua duoc nguoi khac dat truoc ban vai phan tram giay!"
======================================================================
KET QUA: CONCURRENCY CONFLICT LEVEL 2 HOAT DONG CHUAN XAC!
>> So luot dat ghi nhan trong SQLite: 1 duy nhat (Chong overbooking 100%)
======================================================================
TEST 2: GIOI HAN 3 CA HOC / NGAY -> BLOCKED AT 4TH BOOKING (PASS)
TEST 3: QUY TAC HUY PHONG TRUOC 3 TIENG -> BLOCKED FOR PAST/IMMINENT SLOTS (PASS)
======================================================================
```

### Screenshot 4: Admin Management Dashboard
* **Location:** `client/src/pages/AdminDashboardPage.tsx` & `mobile/src/screens/AdminScreen.tsx`
* **Evidence:** Live analytical counters (Total rooms, Available, Maintenance, Daily bookings, Total bookings), Room CRUD interface with real-time toggle switch, and student booking revocation controls.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Challenge 1: Race Condition & Concurrency Overbooking (Simultaneous Booking Clash)
* **Context & Problem:** When two students click "Xác nhận đặt phòng" at the exact same sub-second for a popular study room, standard asynchronous Node.js `await findOne()` followed by `await create()` leads to dirty reads (Time-of-Check to Time-of-Use vulnerability). Both queries believe the room is available, creating duplicate confirmed bookings for the same slot.
* **Root Cause:** Asynchronous gap between read validation and write insertion in non-atomic database operations.
* **Engineered Resolution:**
  1. Configured SQLite database with **WAL (Write-Ahead Logging)** mode (`PRAGMA journal_mode = WAL`) to permit non-blocking parallel reads while serializing atomic writes.
  2. Applied an explicit **Partial Unique Index** at the database schema level:
     ```sql
     CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
     ON bookings (room_id, booking_date, slot_id) 
     WHERE status = 'CONFIRMED';
     ```
  3. Wrapped booking validation and insertion inside a single synchronous `db.transaction()`. The transaction guarantees ACID isolation. The first commit succeeds (`HTTP 201`), while the lagging thread triggers an instant index conflict handled as `HTTP 409 Conflict`.

---

### Challenge 2: University Wi-Fi AP Isolation & Cross-Device Network Routing for Mobile App
* **Context & Problem:** While developing and testing the React Native Expo app on a physical iPhone connected to university campus Wi-Fi (**VKU-SinhVien**), the mobile device could not establish a connection to the development machine running the backend on `http://10.60.46.152:5000`.
* **Root Cause:** University enterprise routers enforce **Access Point Isolation (Client Isolation)**, which strictly drops peer-to-peer TCP/UDP packets between Wi-Fi clients to prevent intranet spoofing. Initial attempts to use basic HTTP tunnels (*localtunnel*) failed because their overloaded servers returned HTTP 408 Request Timeouts and interstitial HTML reminder pages (`Unexpected character: B` error in React Native `res.json()`).
* **Engineered Resolution:**
  1. Integrated **Cloudflare Quick Tunnel (`cloudflared`)** with a dedicated edge connection to Hong Kong (`hkg12`). This provided a trusted HTTPS endpoint with valid SSL certificates natively compliant with Apple's iOS **App Transport Security (ATS)**.
  2. Enhanced `mobile/src/api/client.ts` and `SocketContext.tsx` with dynamic host discovery and dual-transport fallback (`['websocket', 'polling']`).
  3. Added an embedded diagnostics widget in `ProfileScreen.tsx` with a live **"⚡ Kiểm tra kết nối"** ping button, allowing instantaneous latency verification (~28ms) and custom server IP override without recompiling.

---

### Challenge 3: GitHub Pages Static Single-Page Application (SPA) Asset Resolution & CI/CD
* **Context & Problem:** Deploying a Vite React single-page application into a GitHub Pages project repository (`https://<user>.github.io/StudyBooking-/`) introduces deep path nesting. Without proper configuration, the browser requests assets from root `/assets/...` instead of `/StudyBooking-/assets/...`, producing blank screen 404 errors. Furthermore, Vite's local development proxy does not exist on static GitHub Pages hosting.
* **Root Cause:** Mismatch between Vite's default absolute asset path `/` and GitHub Pages sub-directory hosting, combined with lack of server-side proxy on static hosts.
* **Engineered Resolution:**
  1. Configured relative base routing in `client/vite.config.ts`: `base: './'`, ensuring all JS/CSS asset paths are relative to the loaded HTML document regardless of domain or subdirectory.
  2. Implemented dynamic API host resolution in `client/src/services/api.ts`: detects if `window.location.hostname` is `localhost`; if hosted on `github.io`, it automatically proxies all REST API and Socket.io traffic to the live Cloudflare backend tunnel.
  3. Automated full CI/CD deployment via `.github/workflows/deploy.yml` using GitHub Actions and published a pre-compiled, production-ready `gh-pages` branch for zero-friction hosting.
