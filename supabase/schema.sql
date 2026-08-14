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
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'successful' CHECK (payment_status IN ('pending', 'successful', 'failed', 'refunded')),
    transaction_reference TEXT UNIQUE NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WAITLIST TABLE
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position > 0 AND position <= 4),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'promoted', 'cancelled', 'refunded')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, position)
);

-- 6. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, student_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- Events Policies
CREATE POLICY "Published events viewable by everyone"
    ON public.events FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can insert/update/delete events"
    ON public.events FOR ALL
    USING (public.is_admin());

-- Registrations Policies
CREATE POLICY "Registrations viewable by owner or admin"
    ON public.registrations FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can insert own registration"
    ON public.registrations FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own registration"
    ON public.registrations FOR UPDATE
    USING (student_id = auth.uid() OR public.is_admin());

-- Payments Policies
CREATE POLICY "Payments viewable by owner or admin"
    ON public.payments FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

-- Waitlist Policies
CREATE POLICY "Waitlist viewable by owner or admin"
    ON public.waitlist FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

-- Attendance Policies
CREATE POLICY "Attendance viewable by owner or admin"
    ON public.attendance FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

-- ====================================================================
-- AUTH TRIGGER FOR PROFILES
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, register_number, email, department, year, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
        COALESCE(NEW.raw_user_meta_data->>'register_number', 'PENDING'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science'),
        COALESCE(NEW.raw_user_meta_data->>'year', '1st Year'),
        'student'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        register_number = EXCLUDED.register_number,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        year = EXCLUDED.year;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ATOMIC RPC FUNCTIONS FOR EVENT MANAGEMENT
-- ====================================================================

-- 0. RPC: get_event_counts
CREATE OR REPLACE FUNCTION public.get_event_counts(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_confirmed INTEGER;
    v_waitlisted INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_confirmed FROM public.registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    SELECT COUNT(*) INTO v_waitlisted FROM public.waitlist
    WHERE event_id = p_event_id AND status = 'waiting';

    RETURN jsonb_build_object(
        'confirmed_count', COALESCE(v_confirmed, 0),
        'waitlist_count', COALESCE(v_waitlisted, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. RPC: register_for_event
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event public.events%ROWTYPE;
    v_confirmed_count INTEGER;
    v_existing_reg public.registrations%ROWTYPE;
    v_existing_waitlist public.waitlist%ROWTYPE;
    v_reg_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    -- Lock event row for concurrency safety
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
        RETURN jsonb_build_object('success', false, 'message', 'Registration is closed for this event.');
    END IF;

    -- Check if student already registered
    SELECT * INTO v_existing_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'confirmed';

    IF v_existing_reg IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You are already registered for this event.');
    END IF;

    -- Check if student is on waitlist
    SELECT * INTO v_existing_waitlist FROM public.waitlist
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'waiting';

    IF v_existing_waitlist IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You are already on the waitlist for this event.');
    END IF;

    -- Calculate confirmed registrations count
    SELECT COUNT(*) INTO v_confirmed_count FROM public.registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    -- Capacity Check
    IF v_confirmed_count >= v_event.capacity THEN
        RETURN jsonb_build_object('success', false, 'is_full', true, 'message', 'Event is full. Please join the waitlist.');
    END IF;

    -- Create Registration
    IF v_event.fee > 0 THEN
        -- Free registration placeholder awaiting mock payment confirmation
        INSERT INTO public.registrations (
            event_id,
            student_id,
            status,
            payment_status
        )
        VALUES (
            p_event_id,
            v_student_id,
            'confirmed',
            'pending'
        )
        RETURNING id INTO v_reg_id;

        RETURN jsonb_build_object(
            'success', true,
            'requires_payment', true,
            'registration_id', v_reg_id,
            'amount', v_event.fee,
            'message', 'Registration created. Please complete payment.'
        );
    ELSE
        -- Free Event
        INSERT INTO public.registrations (
            event_id,
            student_id,
            status,
            payment_status
        )
        VALUES (
            p_event_id,
            v_student_id,
            'confirmed',
            'not_required'
        )
        RETURNING id INTO v_reg_id;

        RETURN jsonb_build_object(
            'success', true,
            'requires_payment', false,
            'registration_id', v_reg_id,
            'message', 'Registration successful!'
        );
    END IF;
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
    v_reg public.registrations%ROWTYPE;
    v_payment_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_reg FROM public.registrations WHERE id = p_registration_id AND student_id = v_student_id;

    IF v_reg IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registration not found.');
    END IF;

    -- Record Payment
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
        v_reg.event_id,
        p_amount,
        'successful',
        p_tx_ref,
        NOW()
    )
    RETURNING id INTO v_payment_id;

    -- Update Registration Status
    UPDATE public.registrations
    SET payment_status = 'successful',
        updated_at = NOW()
    WHERE id = p_registration_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'message', 'Payment recorded successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: cancel_registration
CREATE OR REPLACE FUNCTION public.cancel_registration(p_registration_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_reg public.registrations%ROWTYPE;
    v_event public.events%ROWTYPE;
    v_next_waitlist public.waitlist%ROWTYPE;
    v_promoted_student_id UUID;
    v_new_reg_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    -- Find registration
    SELECT * INTO v_reg FROM public.registrations
    WHERE id = p_registration_id AND (student_id = v_student_id OR public.is_admin());

    IF v_reg IS NULL OR v_reg.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Active registration not found.');
    END IF;

    -- Find event
    SELECT * INTO v_event FROM public.events WHERE id = v_reg.event_id FOR UPDATE;

    IF NOW() > v_event.cancellation_deadline THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cancellation deadline has passed.');
    END IF;

    -- Cancel Registration
    UPDATE public.registrations
    SET status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_registration_id;

    -- AUTOMATIC FIFO WAITLIST PROMOTION
    SELECT * INTO v_next_waitlist FROM public.waitlist
    WHERE event_id = v_event.id AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1;

    IF v_next_waitlist IS NOT NULL THEN
        v_promoted_student_id := v_next_waitlist.student_id;

        INSERT INTO public.registrations (
            event_id,
            student_id,
            status,
            payment_status
        )
        VALUES (
            v_event.id,
            v_promoted_student_id,
            'confirmed',
            CASE WHEN v_event.fee > 0 THEN 'successful' ELSE 'not_required' END
        )
        RETURNING id INTO v_new_reg_id;

        UPDATE public.waitlist
        SET status = 'promoted',
            updated_at = NOW()
        WHERE id = v_next_waitlist.id;

        UPDATE public.waitlist
        SET position = position - 1,
            updated_at = NOW()
        WHERE event_id = v_event.id AND status = 'waiting';

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Registration cancelled. Seat auto-promoted to waitlisted student.',
            'promoted_student_id', v_promoted_student_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Registration cancelled successfully.'
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
    v_event public.events%ROWTYPE;
    v_confirmed_count INTEGER;
    v_active_waitlist_count INTEGER;
    v_existing_reg public.registrations%ROWTYPE;
    v_existing_waitlist public.waitlist%ROWTYPE;
    v_payment_id UUID;
    v_waitlist_id UUID;
    v_next_position INTEGER;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;

    IF v_event IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    SELECT COUNT(*) INTO v_confirmed_count FROM public.registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    IF v_confirmed_count < v_event.capacity THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event still has open seats. Please register directly.');
    END IF;

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

    SELECT COUNT(*) INTO v_active_waitlist_count FROM public.waitlist
    WHERE event_id = p_event_id AND status = 'waiting';

    IF v_active_waitlist_count >= 4 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Waitlist is full (Maximum 4 waitlisted students allowed).');
    END IF;

    v_next_position := v_active_waitlist_count + 1;

    IF p_amount > 0 THEN
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
    END IF;

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
    v_event public.events%ROWTYPE;
    v_reg public.registrations%ROWTYPE;
    v_existing_att public.attendance%ROWTYPE;
    v_att_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;

    IF v_event IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found.');
    END IF;

    IF v_event.check_in_token IS NULL OR v_event.check_in_token != p_check_in_token THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid 4-digit check-in PIN.');
    END IF;

    IF v_event.check_in_start_at IS NOT NULL AND NOW() < v_event.check_in_start_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Check-in period has not started yet.');
    END IF;

    IF v_event.check_in_end_at IS NOT NULL AND NOW() > v_event.check_in_end_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Check-in period has ended.');
    END IF;

    SELECT * INTO v_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_student_id AND status = 'confirmed';

    IF v_reg IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You do not have a confirmed registration for this event.');
    END IF;

    SELECT * INTO v_existing_att FROM public.attendance
    WHERE event_id = p_event_id AND student_id = v_student_id;

    IF v_existing_att IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_checked_in', true,
            'message', 'You have already checked in to this event on ' || to_char(v_existing_att.checked_in_at, 'Mon DD, YYYY HH:MI AM')
        );
    END IF;

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
        'message', 'Attendance marked PRESENT successfully!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configure storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Poster images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-posters');

CREATE POLICY "Authenticated users can upload poster images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'event-posters' AND auth.role() = 'authenticated');
