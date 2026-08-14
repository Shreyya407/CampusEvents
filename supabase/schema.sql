-- ====================================================================
-- ONLINE COLLEGE EVENT REGISTRATION SYSTEM - COMPLETE SUPABASE SCHEMA
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    register_number TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    poster_url TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    registration_open_at TIMESTAMPTZ NOT NULL,
    registration_close_at TIMESTAMPTZ NOT NULL,
    cancellation_deadline TIMESTAMPTZ NOT NULL,
    fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (fee >= 0),
    rules TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_by UUID REFERENCES public.profiles(id),
    check_in_start_at TIMESTAMPTZ,
    check_in_end_at TIMESTAMPTZ,
    check_in_token TEXT DEFAULT floor(1000 + random() * 9000)::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'successful', 'failed', 'refunded')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'successful' CHECK (payment_status IN ('not_required', 'pending', 'successful', 'failed', 'refunded')),
    transaction_reference TEXT NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WAITLIST TABLE
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'confirmed', 'not_confirmed', 'refunded', 'cancelled')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status = 'present'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_event_attendance UNIQUE (event_id, student_id)
);

-- ====================================================================
-- SUPABASE AUTH USER TRIGGER TO CREATING PROFILES
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        register_number,
        email,
        department,
        year,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
        COALESCE(NEW.raw_user_meta_data->>'register_number', 'REG' || substring(NEW.id::text from 1 for 6)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'year', '1'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        register_number = EXCLUDED.register_number,
        department = EXCLUDED.department,
        year = EXCLUDED.year;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Profiles viewable by self or admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles updatable by self or admin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insertable by user or trigger" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- EVENTS POLICIES
CREATE POLICY "Events viewable by everyone if published, or admin all" ON public.events
    FOR SELECT USING (status = 'published' OR public.is_admin());

CREATE POLICY "Events full access for admin" ON public.events
    FOR ALL USING (public.is_admin());

-- REGISTRATIONS POLICIES
CREATE POLICY "Registrations viewable by owner or admin" ON public.registrations
    FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Registrations full access for admin" ON public.registrations
    FOR ALL USING (public.is_admin());

-- PAYMENTS POLICIES
CREATE POLICY "Payments viewable by owner or admin" ON public.payments
    FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Payments full access for admin" ON public.payments
    FOR ALL USING (public.is_admin());

-- WAITLIST POLICIES
CREATE POLICY "Waitlist viewable by owner or admin" ON public.waitlist
    FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Waitlist full access for admin" ON public.waitlist
    FOR ALL USING (public.is_admin());

-- ATTENDANCE POLICIES
CREATE POLICY "Attendance viewable by owner or admin" ON public.attendance
    FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Attendance full access for admin" ON public.attendance
    FOR ALL USING (public.is_admin());


-- ====================================================================
-- BUSINESS LOGIC RPC FUNCTIONS (SECURITY DEFINER)
-- ====================================================================

-- 1. RPC: register_for_event
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
    v_confirmed_count INTEGER;
    v_existing_reg RECORD;
    v_reg_id UUID;
    v_payment_status TEXT;
BEGIN
    -- Auth check
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    -- Fetch event with row lock to prevent race conditions
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;

    IF v_event IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    IF v_event.status != 'published' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event is not open for registration.');
    END IF;

    IF NOW() < v_event.registration_open_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration has not opened yet.');
    END IF;

    IF NOW() > v_event.registration_close_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration period has closed.');
    END IF;

    -- Check if student already has active registration
    SELECT * INTO v_existing_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'confirmed';

    IF v_existing_reg IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You are already registered for this event.');
    END IF;

    -- Count active confirmed registrations
    SELECT COUNT(*) INTO v_confirmed_count FROM public.registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    IF v_confirmed_count >= v_event.capacity THEN
        RETURN jsonb_build_object('success', false, 'is_full', true, 'message', 'Event is full. Please join the waitlist.');
    END IF;

    -- Determine initial payment status
    IF v_event.fee = 0 THEN
        v_payment_status := 'not_required';
    ELSE
        v_payment_status := 'pending';
    END IF;

    -- Insert registration
    INSERT INTO public.registrations (
        event_id,
        student_id,
        status,
        payment_status,
        registered_at
    )
    VALUES (
        p_event_id,
        v_student_id,
        'confirmed',
        v_payment_status,
        NOW()
    )
    RETURNING id INTO v_reg_id;

    RETURN jsonb_build_object(
        'success', true,
        'registration_id', v_reg_id,
        'requires_payment', (v_event.fee > 0),
        'fee', v_event.fee,
        'message', CASE WHEN v_event.fee > 0 THEN 'Registration initiated. Mock payment required.' ELSE 'Registration successful!' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC: complete_mock_payment
CREATE OR REPLACE FUNCTION public.complete_mock_payment(
    p_registration_id UUID,
    p_amount NUMERIC,
    p_tx_ref TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_reg RECORD;
    v_payment_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_reg FROM public.registrations WHERE id = p_registration_id AND student_id = v_student_id;

    IF v_reg IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration record not found.');
    END IF;

    -- Create Payment Record
    INSERT INTO public.payments (
        registration_id,
        student_id,
        event_id,
        amount,
        payment_status,
        transaction_reference,
        paid_at
    )
    VALUES (
        p_registration_id,
        v_student_id,
        v_reg.event_id,
        p_amount,
        'successful',
        p_tx_ref,
        NOW()
    )
    RETURNING id INTO v_payment_id;

    -- Update registration payment status
    UPDATE public.registrations
    SET payment_status = 'successful',
        updated_at = NOW()
    WHERE id = p_registration_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'message', 'Payment recorded successfully! Registration confirmed.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: cancel_registration
CREATE OR REPLACE FUNCTION public.cancel_registration(p_registration_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_reg RECORD;
    v_event RECORD;
    v_first_waitlist RECORD;
    v_promoted_reg_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_reg FROM public.registrations WHERE id = p_registration_id FOR UPDATE;

    IF v_reg IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration not found.');
    END IF;

    -- Ownership or Admin check
    IF v_reg.student_id != v_student_id AND NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized to cancel this registration.');
    END IF;

    IF v_reg.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration is already cancelled.');
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = v_reg.event_id;

    -- Check cancellation deadline
    IF NOW() > v_event.cancellation_deadline AND NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cancellation deadline has passed.');
    END IF;

    -- Cancel registration
    UPDATE public.registrations
    SET status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_registration_id;

    -- Check if payment needs to be updated/refunded (if paid)
    IF v_reg.payment_status = 'successful' THEN
        UPDATE public.payments
        SET payment_status = 'refunded',
            refunded_at = NOW(),
            updated_at = NOW()
        WHERE registration_id = p_registration_id;

        UPDATE public.registrations
        SET payment_status = 'refunded'
        WHERE id = p_registration_id;
    END IF;

    -- SMART WAITLIST AUTO-PROMOTION (FIFO)
    -- Find earliest waiting student (position 1)
    SELECT * INTO v_first_waitlist FROM public.waitlist
    WHERE event_id = v_reg.event_id AND status = 'waiting'
    ORDER BY position ASC LIMIT 1 FOR UPDATE;

    IF v_first_waitlist IS NOT NULL THEN
        -- 1. Create active confirmed registration for waitlisted student
        INSERT INTO public.registrations (
            event_id,
            student_id,
            status,
            payment_status,
            registered_at
        )
        VALUES (
            v_reg.event_id,
            v_first_waitlist.student_id,
            'confirmed',
            'successful',
            NOW()
        )
        RETURNING id INTO v_promoted_reg_id;

        -- 2. Update payment link to point to new registration
        IF v_first_waitlist.payment_id IS NOT NULL THEN
            UPDATE public.payments
            SET registration_id = v_promoted_reg_id
            WHERE id = v_first_waitlist.payment_id;
        END IF;

        -- 3. Update waitlist entry status
        UPDATE public.waitlist
        SET status = 'confirmed',
            confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_first_waitlist.id;

        -- 4. Shift remaining waiting positions up by 1
        UPDATE public.waitlist
        SET position = position - 1,
            updated_at = NOW()
        WHERE event_id = v_reg.event_id AND status = 'waiting';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Registration cancelled successfully.',
        'auto_promoted', (v_first_waitlist IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: join_event_waitlist
CREATE OR REPLACE FUNCTION public.join_event_waitlist(
    p_event_id UUID,
    p_amount NUMERIC,
    p_tx_ref TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
    v_active_waitlist_count INTEGER;
    v_existing_waitlist RECORD;
    v_existing_reg RECORD;
    v_next_position INTEGER;
    v_payment_id UUID;
    v_waitlist_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;

    IF v_event IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    -- Check if student already has active registration or active waitlist
    SELECT * INTO v_existing_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'confirmed';

    IF v_existing_reg IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You already have an active registration for this event.');
    END IF;

    SELECT * INTO v_existing_waitlist FROM public.waitlist
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'waiting';

    IF v_existing_waitlist IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You are already on the waitlist for this event.');
    END IF;

    -- Count active waiting students
    SELECT COUNT(*) INTO v_active_waitlist_count FROM public.waitlist
    WHERE event_id = p_event_id AND status = 'waiting';

    IF v_active_waitlist_count >= 4 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Waitlist is full (Maximum 4 waitlisted students allowed).');
    END IF;

    v_next_position := v_active_waitlist_count + 1;

    -- Create Payment Record for Paid Waitlist
    INSERT INTO public.payments (
        student_id,
        event_id,
        amount,
        payment_status,
        transaction_reference,
        paid_at
    )
    VALUES (
        v_student_id,
        p_event_id,
        p_amount,
        'successful',
        p_tx_ref,
        NOW()
    )
    RETURNING id INTO v_payment_id;

    -- Insert Waitlist Record
    INSERT INTO public.waitlist (
        event_id,
        student_id,
        position,
        payment_id,
        status,
        joined_at
    )
    VALUES (
        p_event_id,
        v_student_id,
        v_next_position,
        v_payment_id,
        'waiting',
        NOW()
    )
    RETURNING id INTO v_waitlist_id;

    RETURN jsonb_build_object(
        'success', true,
        'waitlist_id', v_waitlist_id,
        'position', v_next_position,
        'message', 'Joined waitlist successfully! Your position is #' || v_next_position
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: check_in_student
CREATE OR REPLACE FUNCTION public.check_in_student(
    p_event_id UUID,
    p_check_in_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
    v_reg RECORD;
    v_existing_att RECORD;
    v_att_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;

    IF v_event IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    -- Token validation
    IF v_event.check_in_token IS NULL OR v_event.check_in_token != p_check_in_token THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid event QR check-in code.');
    END IF;

    -- Check-in window validation
    IF v_event.check_in_start_at IS NOT NULL AND NOW() < v_event.check_in_start_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Check-in period has not started yet.');
    END IF;

    IF v_event.check_in_end_at IS NOT NULL AND NOW() > v_event.check_in_end_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Check-in period has ended.');
    END IF;

    -- Verify confirmed registration
    SELECT * INTO v_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'confirmed';

    IF v_reg IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You do not have a confirmed registration for this event.');
    END IF;

    -- Duplicate check-in check
    SELECT * INTO v_existing_att FROM public.attendance
    WHERE event_id = p_event_id AND student_id = v_student_id;

    IF v_existing_att IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_checked_in', true,
            'message', 'You have already checked in to this event on ' || to_char(v_existing_att.checked_in_at, 'Mon DD, YYYY HH:MI AM')
        );
    END IF;

    -- Create Attendance Record
    INSERT INTO public.attendance (
        event_id,
        student_id,
        registration_id,
        checked_in_at,
        status
    )
    VALUES (
        p_event_id,
        v_student_id,
        v_reg.id,
        NOW(),
        'present'
    )
    RETURNING id INTO v_att_id;

    RETURN jsonb_build_object(
        'success', true,
        'attendance_id', v_att_id,
        'message', 'Attendance successfully marked: PRESENT!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION FOR EVENT POSTERS
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read for event posters" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-posters');

CREATE POLICY "Admin full access for event posters" ON storage.objects
    FOR ALL USING (bucket_id = 'event-posters' AND public.is_admin());
