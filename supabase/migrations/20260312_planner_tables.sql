-- Migration: Add planner tables for course registration planning

-- 1. Planner state (selected module, import status)
CREATE TABLE public.planner_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  selected_module TEXT,
  curriculum_imported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planner_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planner state"
ON public.planner_state FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner state"
ON public.planner_state FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planner state"
ON public.planner_state FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planner state"
ON public.planner_state FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_planner_state_updated_at
BEFORE UPDATE ON public.planner_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Planner registrations (semester-based course registration)
CREATE TABLE public.planner_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  semester_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planner_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planner registrations"
ON public.planner_registrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner registrations"
ON public.planner_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planner registrations"
ON public.planner_registrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planner registrations"
ON public.planner_registrations FOR DELETE USING (auth.uid() = user_id);

-- 3. Manual passed courses (PE, English, Military tick)
CREATE TABLE public.planner_manual_passed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_code)
);

ALTER TABLE public.planner_manual_passed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own manual passed"
ON public.planner_manual_passed FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual passed"
ON public.planner_manual_passed FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual passed"
ON public.planner_manual_passed FOR DELETE USING (auth.uid() = user_id);
