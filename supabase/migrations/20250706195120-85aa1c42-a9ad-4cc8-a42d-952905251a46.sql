
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('participant', 'mentor', 'admin');

-- Create enum for task submission status
CREATE TYPE submission_status AS ENUM ('pending', 'graded');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  mentor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  metrics JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task submissions table
CREATE TABLE public.task_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  status submission_status NOT NULL DEFAULT 'pending',
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, participant_id)
);

-- Create daily updates table
CREATE TABLE public.daily_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metrics table
CREATE TABLE public.scoring_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default metrics
INSERT INTO public.scoring_metrics (name, description, max_points) VALUES
('Technical Skills', 'Technical proficiency and implementation quality', 100),
('Consistency', 'Regular participation and commitment to tasks', 100),
('Teamwork', 'Collaboration and communication skills', 100);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Only admins can manage tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Task submissions policies
CREATE POLICY "Users can view own submissions" ON public.task_submissions FOR SELECT USING (
  participant_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'mentor' OR role = 'admin'))
);
CREATE POLICY "Participants can insert own submissions" ON public.task_submissions FOR INSERT WITH CHECK (participant_id = auth.uid());
CREATE POLICY "Mentors and admins can update submissions" ON public.task_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'mentor' OR role = 'admin'))
);

-- Daily updates policies
CREATE POLICY "Participants can manage own updates" ON public.daily_updates FOR ALL USING (participant_id = auth.uid());
CREATE POLICY "Mentors can view assigned participant updates" ON public.daily_updates FOR SELECT USING (
  mentor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Scoring metrics policies
CREATE POLICY "Anyone can view metrics" ON public.scoring_metrics FOR SELECT USING (true);
CREATE POLICY "Only admins can manage metrics" ON public.scoring_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'participant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank INTEGER,
  participant_id UUID,
  name TEXT,
  username TEXT,
  email TEXT,
  tasks_completed BIGINT,
  total_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH participant_scores AS (
    SELECT 
      p.id,
      p.name,
      p.username,
      au.email,
      COUNT(ts.id) as completed_tasks,
      COALESCE(SUM(ts.total_score), 0) as total_score
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    LEFT JOIN public.task_submissions ts ON p.id = ts.participant_id AND ts.status = 'graded'
    WHERE p.role = 'participant'
    GROUP BY p.id, p.name, p.username, au.email
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ps.total_score DESC, ps.completed_tasks DESC)::INTEGER as rank,
    ps.id as participant_id,
    ps.name,
    ps.username,
    ps.email,
    ps.completed_tasks,
    ps.total_score
  FROM participant_scores ps
  ORDER BY ps.total_score DESC, ps.completed_tasks DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.daily_updates REPLICA IDENTITY FULL;
ALTER TABLE public.scoring_metrics REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_metrics;
