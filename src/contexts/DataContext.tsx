
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskSubmission, LeaderboardEntry, Metric, DailyUpdate } from '../types';

interface DataContextType {
  tasks: Task[];
  submissions: TaskSubmission[];
  leaderboard: LeaderboardEntry[];
  metrics: Metric[];
  dailyUpdates: DailyUpdate[];
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  submitScore: (submission: Omit<TaskSubmission, 'id'>) => void;
  addDailyUpdate: (update: Omit<DailyUpdate, 'id'>) => void;
  updateLeaderboard: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      description: 'Complete a comprehensive report on ML fundamentals and implement a basic classification algorithm.',
      due_date: '2024-07-20',
      created_at: '2024-07-01',
      metrics: ['technical', 'consistency', 'teamwork'],
      max_score: 100,
    },
    {
      id: '2',
      title: 'AI Ethics Research',
      description: 'Research and present on AI ethics in modern applications, focusing on bias and fairness.',
      due_date: '2024-07-25',
      created_at: '2024-07-02',
      metrics: ['technical', 'consistency'],
      max_score: 80,
    },
  ]);

  const [submissions, setSubmissions] = useState<TaskSubmission[]>([
    {
      id: '1',
      task_id: '1',
      participant_id: '1',
      scores: { technical: 85, consistency: 90, teamwork: 88 },
      total_score: 263,
      status: 'graded',
      graded_at: '2024-07-08',
    },
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [metrics] = useState<Metric[]>([
    { id: '1', name: 'Technical Skills', description: 'Technical proficiency and implementation', max_points: 100 },
    { id: '2', name: 'Consistency', description: 'Regular participation and commitment', max_points: 100 },
    { id: '3', name: 'Teamwork', description: 'Collaboration and communication skills', max_points: 100 },
  ]);

  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);

  const addTask = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const submitScore = (submissionData: Omit<TaskSubmission, 'id'>) => {
    const newSubmission: TaskSubmission = {
      ...submissionData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setSubmissions(prev => [...prev, newSubmission]);
    updateLeaderboard();
  };

  const addDailyUpdate = (updateData: Omit<DailyUpdate, 'id'>) => {
    const newUpdate: DailyUpdate = {
      ...updateData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setDailyUpdates(prev => [...prev, newUpdate]);
  };

  const updateLeaderboard = () => {
    // Mock leaderboard data - in real app, this would calculate from actual submissions
    const mockLeaderboard: LeaderboardEntry[] = [
      { rank: 1, name: 'Alice Johnson', username: 'alice_j', email: 'alice@example.com', tasks_completed: 2, total_score: 450 },
      { rank: 2, name: 'Bob Smith', username: 'bob_smith', email: 'bob@example.com', tasks_completed: 2, total_score: 420 },
      { rank: 3, name: 'Carol Williams', username: 'carol_w', email: 'carol@example.com', tasks_completed: 1, total_score: 380 },
      { rank: 4, name: 'David Brown', username: 'david_b', email: 'david@example.com', tasks_completed: 2, total_score: 350 },
      { rank: 5, name: 'Emma Davis', username: 'emma_d', email: 'emma@example.com', tasks_completed: 1, total_score: 320 },
    ];
    setLeaderboard(mockLeaderboard);
  };

  useEffect(() => {
    updateLeaderboard();
  }, []);

  return (
    <DataContext.Provider value={{
      tasks,
      submissions,
      leaderboard,
      metrics,
      dailyUpdates,
      addTask,
      submitScore,
      addDailyUpdate,
      updateLeaderboard,
    }}>
      {children}
    </DataContext.Provider>
  );
};
