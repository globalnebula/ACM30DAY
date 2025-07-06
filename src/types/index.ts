
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'participant' | 'mentor' | 'admin';
  createdAt: string;
  mentorId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  metrics: string[];
  max_score: number;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  participant_id: string;
  scores: Record<string, number>;
  total_score: number;
  graded_by?: string;
  graded_at?: string;
  status: 'pending' | 'graded';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  email: string;
  tasks_completed: number;
  total_score: number;
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  max_points: number;
}

export interface DailyUpdate {
  id: string;
  participant_id: string;
  mentor_id: string;
  content: string;
  date: string;
}
