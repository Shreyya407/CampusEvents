# Online College Event Registration System

A cloud-based college event registration and management system where students can discover events, register for free/paid events, join a limited waitlist, and mark attendance using QR codes. Admins manage events, registrations, payments, waitlists, attendance and analytics.

##  Tech Stack

* **Frontend:** React, TypeScript, Vite
* **UI:** Tailwind CSS
* **Routing:** React Router
* **Backend:** Supabase
* **Database:** PostgreSQL
* **Authentication:** Supabase Auth
* **Security:** Row Level Security (RLS)
* **Backend Logic:** PostgreSQL Functions / RPC
* **Storage:** Supabase Storage
* **Attendance:** QR Code
* **Payments:** Mock Payment System

##  Vibe Coding / Development Tools

* **Google Stitch** — UI/UX design and visual reference
* **Antigravity** — AI-assisted application development and Supabase integration
* **Bolt** — AI-assisted prototyping and development
* **Git/GitHub** — Version control

##  Key Features

* Student & Admin role-based access
* Event creation and management
* Free and paid registration
* Mock payment processing
* Smart paid waitlist — **maximum 4, FIFO**
* Automatic waitlist confirmation/refund
* Registration deadlines & capacity management
* QR-based attendance
* Admin analytics
* Responsive design

##  Architecture

**React → Supabase Client → Supabase Auth + PostgreSQL + RLS + RPC + Storage**

Supabase acts as the **source of truth** for all application data and backend logic.
