
-- Create admin role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Schedule settings table
CREATE TABLE public.schedule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME NOT NULL DEFAULT '08:00',
    close_time TIME NOT NULL DEFAULT '21:00',
    UNIQUE (day_of_week)
);
ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;

-- Blocked slots table
CREATE TABLE public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    services_selected JSONB NOT NULL DEFAULT '[]',
    total_price NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao', 'dinheiro')),
    payment_status TEXT NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'confirmado', 'cancelado')),
    status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'concluido', 'cancelado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles: only admins can see
CREATE POLICY "Admins can view roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- services: everyone can read active, admin can manage
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- schedule_settings: everyone can read, admin can manage
CREATE POLICY "Anyone can view schedule" ON public.schedule_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage schedule" ON public.schedule_settings
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blocked_slots: everyone can read, admin can manage
CREATE POLICY "Anyone can view blocked slots" ON public.blocked_slots
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage blocked slots" ON public.blocked_slots
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- appointments: anyone can insert (clients book without auth), admin can see all
CREATE POLICY "Anyone can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all appointments" ON public.appointments
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appointments" ON public.appointments
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments" ON public.appointments
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Insert default schedule (Terça=2 to Sábado=6 open, Domingo=0 and Segunda=1 closed)
INSERT INTO public.schedule_settings (day_of_week, is_open, open_time, close_time) VALUES
    (0, false, '08:00', '21:00'),  -- Domingo
    (1, false, '08:00', '21:00'),  -- Segunda
    (2, true, '08:00', '21:00'),   -- Terça
    (3, true, '08:00', '21:00'),   -- Quarta
    (4, true, '08:00', '21:00'),   -- Quinta
    (5, true, '08:00', '21:00'),   -- Sexta
    (6, true, '08:00', '21:00');   -- Sábado

-- Insert default services
INSERT INTO public.services (name, price, sort_order) VALUES
    ('Corte Degradê', 25.00, 1),
    ('Corte Simples', 20.00, 2),
    ('Barba', 10.00, 3),
    ('Bigode + Cavanhaque', 5.00, 4),
    ('Sobrancelha', 5.00, 5),
    ('Sobrancelha Feminina', 10.00, 6),
    ('Pigmentação', 10.00, 7);
