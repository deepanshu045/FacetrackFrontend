# Plan: AI Face Recognition Attendance System UI

## Context
The user has a working FastAPI backend with JWT auth and face recognition. The UI must map exactly to the existing backend models — no invented fields. This is a production-ready frontend for an AI attendance system with a premium SaaS dark aesthetic.

## Backend Models (strict — no extras)

**Student**: `id, roll_no, name, email, department, face_image, face_encoding, created_at`  
**Attendance**: `id, student_id, attendance_date, attendance_time`  
**Admin**: `id, username, email, password_hash`

## Theme & Fonts
- **fonts.css**: Import `Inter` from Google Fonts
- **theme.css**: Update tokens:
  - `--background: #020817`, surface `#111827`, card `#1E293B`
  - `--primary: #2563EB`, success `#22C55E`, warning `#F59E0B`, danger `#EF4444`
  - `--radius: 0.875rem`
  - Preserve all existing token names (`--background`, `--foreground`, `--border`, etc.)

## Pages & Field Mapping

### Login
- Fields: `username`, `password` → POST `/auth/login` → JWT token
- Glassmorphism card on dark animated gradient background

### Dashboard
- Stat cards derived from real endpoints:
  - Total Students (count from student list)
  - Today's Attendance (count from today's report)
  - Registered Faces (students where `face_encoding` is not null)
  - Recognition Accuracy (static display or derived from recognition logs)
- Charts: Weekly attendance line, department pie, monthly bar — all from attendance data
- Recent Attendance table columns: **Name, Roll No, Department, Attendance Date, Attendance Time** (no Status badge — backend has no present/absent field)

### Students Page
- Table columns: **Roll No, Name, Email, Department, Face Registered** (boolean: `face_image != null`), **Actions** (View, Edit, Delete)
- Controls: Search, Department filter, Add Student button, Export CSV
- Add/Edit Student modal fields: **Roll No, Name, Email, Department** only

### Upload Face Page
- Student selector: searchable dropdown by Roll No or Name (no manual ID typing)
- Show selected student: Roll No, Name, Department
- Capture options: live webcam capture OR upload image from device
- Face quality panel: Detected / One Face / Straight / Lighting / Distance / Sharp
- Circular quality score 0–100%

### Live Attendance Page
- Full-width camera feed
- Recognition panel states:
  - Match: Name, Roll No, Department, confidence score, "Attendance Saved Successfully" (green)
  - "Unknown Face"
  - "Attendance Already Marked Today"
  - "Multiple Faces Detected"

### Reports Page
- Filters: Today, Custom Date, Monthly, by Student
- Stat cards: Total Present, Recognition Accuracy, Attendance Percentage (derived from available data)
- Attendance table columns: **Student Name, Roll Number, Department, Attendance Date, Attendance Time**
- Export CSV / Export PDF / Print buttons
- Pagination, search, sorting

### Profile Page
- Admin fields: `username`, `email`, role label, last login
- Change Password button

### Settings Page
- Camera Settings, Face Recognition Threshold (slider), Notifications toggle, Language selector
- Theme toggle (dark/light)

## Layout Components
- `Sidebar` — collapsible, 8 nav items with Lucide icons, active blue glow
- `Navbar` — sticky: page title | search | notifications | theme toggle | avatar dropdown
- `StatCard` — icon, number, trend, hover lift
- `DataTable` — sortable, paginated
- `Modal` — Radix Dialog + motion animation
- `Toast` — sonner
- `StatusBadge`, `SkeletonLoader`, `EmptyState`, `ConfirmDialog`

## Files to Modify
| File | Change |
|---|---|
| `src/styles/fonts.css` | Add Inter Google Fonts `@import` |
| `src/styles/theme.css` | Update color tokens to spec; preserve token structure |
| `src/app/App.tsx` | Full implementation — all pages use only backend-defined fields |

## Key Constraints
- No invented fields: no Class, Section, Semester, Phone, Address, Present/Absent status, Registration Number
- All mock data uses only: `id, roll_no, name, email, department, face_image, face_encoding, created_at` for students; `id, student_id, attendance_date, attendance_time` for attendance
- Every form/table maps directly to a real backend endpoint

## Mobile-Friendly Sidebar (new task)

### Problem
The current `Sidebar` is always `fixed left-0` with a pixel `width` (240 or 72px), and the main layout applies a matching `marginLeft`. On mobile screens this permanently occupies screen real-estate, making the content area too narrow.

### Fix — two-mode sidebar

**State changes in `App` (root):**
- Keep `collapsed: boolean` for desktop icon-only mode
- Add `mobileOpen: boolean` (default `false`) for the mobile drawer

**Sidebar component changes:**
- Accept `mobileOpen` prop
- On **mobile** (`< 1024px`): render as a full off-canvas drawer
  - When closed: `translateX(-100%)`, `width: 240px`, no contribution to layout
  - When open: `translateX(0)`, full width, overlaid above content
- On **desktop** (`≥ 1024px`): existing animated `width` between 240 and 72px, stays in normal flow

Implementation: use a CSS-class strategy —  
`lg:relative lg:translate-x-0` for desktop mode,  
`fixed translate-x-[-100%] lg:translate-x-0` with `mobileOpen && "translate-x-0"` override for mobile.

**Backdrop**: when `mobileOpen` is true, render a `<div className="fixed inset-0 z-20 bg-black/50 lg:hidden">` behind the sidebar that closes it on click.

**Navbar changes:**
- Hamburger button (`Menu` icon) is shown on all screens but wires differently:
  - On mobile: calls `setMobileOpen(true)`
  - On desktop: calls `setCollapsed(c => !c)`
- Since it's the same button, use one `onMenuToggle` handler that the root `App` decides: pass `isMobile` or just always toggle `mobileOpen` on small and `collapsed` on large using `window.innerWidth < 1024` check inside the handler.

**Layout / marginLeft:**
- On mobile: `marginLeft: 0` always (sidebar is overlaid, not in flow)
- On desktop: `marginLeft: sidebarWidth` as before
- Achieve with: inline style `marginLeft` only applied at `lg` breakpoint — or use a Tailwind class approach with a `lg:ml-[240px]` / `lg:ml-[72px]` dynamic class, but since the collapsed width animates with motion, keep the inline style but only apply it conditionally: `marginLeft: window.innerWidth >= 1024 ? sidebarWidth : 0`

Better: track `isDesktop` with a `useEffect` + `window.matchMedia('(min-width: 1024px)')` listener, or simply apply a CSS approach:  
- Wrap main content in `<div className="lg:transition-all">`  
- Use a CSS variable for sidebar width on desktop only

Simplest approach that avoids JS media query:
```
// main content div
className="transition-all duration-300 lg:block"
style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
```
where `isMobile` is a boolean state set by a `useEffect` + `ResizeObserver` or matchMedia listener (runs once on mount + on resize).

**Auto-close on navigation**: in `Sidebar`, call `onClose()` / `setMobileOpen(false)` whenever a nav item is clicked (already fires `onPage`), so the drawer closes automatically when the user navigates.

### Files to change
- `src/app/App.tsx` — only file, changes confined to:
  - `App` component: add `mobileOpen` state + `isMobile` state
  - `Sidebar` component: add mobile drawer classes + backdrop
  - `Navbar` component: hamburger wiring

## Verification
- Login renders with username + password only
- Student table shows exactly: Roll No, Name, Email, Department, Face Registered, Actions
- Reports table shows exactly: Student Name, Roll Number, Department, Attendance Date, Attendance Time
- Upload Face uses student search — no manual ID field
- All 8 pages navigate correctly via sidebar
- On mobile (< 1024px): sidebar is hidden by default, opens as full overlay on hamburger tap, closes on nav or backdrop tap
- On desktop (≥ 1024px): sidebar collapses to icon-only rail, content shifts accordingly
