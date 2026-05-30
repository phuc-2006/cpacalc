-- Migration: Add schedule_plans table for saving generated timetable options

CREATE TABLE public.schedule_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  semester TEXT NOT NULL,
  sections JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX schedule_plans_user_id_idx ON public.schedule_plans(user_id, created_at DESC);

ALTER TABLE public.schedule_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedule plans"
ON public.schedule_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule plans"
ON public.schedule_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule plans"
ON public.schedule_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule plans"
ON public.schedule_plans FOR DELETE USING (auth.uid() = user_id);
