-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checkins table
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for habits
CREATE POLICY "Users can view their own habits" 
ON public.habits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" 
ON public.habits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
ON public.habits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
ON public.habits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for checkins
CREATE POLICY "Users can view checkins for their habits" 
ON public.checkins 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.habits 
  WHERE habits.id = checkins.habit_id 
  AND habits.user_id = auth.uid()
));

CREATE POLICY "Users can create checkins for their habits" 
ON public.checkins 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.habits 
  WHERE habits.id = checkins.habit_id 
  AND habits.user_id = auth.uid()
));

CREATE POLICY "Users can delete checkins for their habits" 
ON public.checkins 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.habits 
  WHERE habits.id = checkins.habit_id 
  AND habits.user_id = auth.uid()
));

-- Create RLS policies for badges
CREATE POLICY "Users can view their own badges" 
ON public.badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own badges" 
ON public.badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_checkins_habit_id ON public.checkins(habit_id);
CREATE INDEX idx_checkins_date ON public.checkins(date);
CREATE INDEX idx_badges_user_id ON public.badges(user_id);