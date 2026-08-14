# Online College Event Registration System

A fully functional, real-time college event management and registration web application built with **React, TypeScript, Vite, Tailwind CSS, and Supabase**.

Designed directly from Google Stitch UI specs (`academic_nexus`, `browse_events`, `event_details`, `student_dashboard`, `admin_dashboard`, `manage_events`, `analytics_admin_portal`, `student_login`, `student_registration`).

---

## Key Features

1. **Role-Based Access Control**:
   - **Student**: Account signup, browsing events with multi-filters, free registration & mock paid registration checkout, smart paid waitlist, QR attendance scanning, ticket passes, profile management.
   - **Admin**: Dashboard metrics, event lifecycle management (draft, published, cancelled, completed), poster image uploads, check-in QR code generator, database audits (registrations, finance, waitlist queue, attendance, students roster), and analytics reporting.

2. **Smart Paid Waitlist (FIFO)**:
   - Maximum 4 active waitlist spots per event.
   - Mock fee deposit for waitlisting.
   - Automatic seat promotion when a confirmed registration is cancelled before deadline.

3. **QR Attendance Check-in**:
   - Secure check-in token generated per event.
   - Validates event token, confirmed registration status, and check-in window.
   - Marks attendance status as `present` in real-time.

4. **Real Supabase Backend**:
   - 6 tables (`profiles`, `events`, `registrations`, `payments`, `waitlist`, `attendance`).
   - RLS security policies.
   - Atomic PostgreSQL `SECURITY DEFINER` RPC functions preventing race conditions.

---

## Getting Started

### 1. Supabase Project Setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](file:///c:/Users/gunja/Downloads/stitch_campusevent_pro/supabase/schema.sql) and execute the SQL query.
4. Update your `.env` file with your project URL and anon key:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Promoting an Admin Account

Admin accounts cannot be created via public student signup.
To create/promote an admin user:
1. Sign up a user in the application or Supabase Auth.
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@college.edu';
   ```

### 3. Running the Web App

Start the development server:
```bash
cmd /c npm run dev
```

Navigate to `http://localhost:3000`.
- Student Login: `/login`
- Admin Login: `/admin/login`
