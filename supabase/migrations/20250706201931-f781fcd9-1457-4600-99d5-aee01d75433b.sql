
-- Create the user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('participant', 'mentor', 'admin');
    END IF;
END $$;

-- Create the submission_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('pending', 'graded');
    END IF;
END $$;

-- Fix the get_leaderboard function to match the expected return type
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  rank integer, 
  participant_id uuid, 
  name text, 
  username text, 
  email text, 
  tasks_completed bigint, 
  total_score bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH participant_scores AS (
    SELECT 
      p.id,
      p.name::text,
      p.username::text,
      COALESCE(au.email, '')::text as email,
      COUNT(ts.id) as completed_tasks,
      COALESCE(SUM(ts.total_score), 0) as total_score
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    LEFT JOIN public.task_submissions ts ON p.id = ts.participant_id AND ts.status = 'graded'
    WHERE p.role = 'participant'
    GROUP BY p.id, p.name, p.username, au.email
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ps.total_score DESC, ps.completed_tasks DESC)::integer as rank,
    ps.id as participant_id,
    ps.name,
    ps.username,
    ps.email,
    ps.completed_tasks,
    ps.total_score
  FROM participant_scores ps
  ORDER BY ps.total_score DESC, ps.completed_tasks DESC;
END;
$function$;

-- Ensure the handle_new_user function works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'participant'::user_role)
  );
  RETURN NEW;
END;
$function$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
