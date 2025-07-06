
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  MessageSquare,
  Trophy,
  Target,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import LeaderboardTable from '@/components/LeaderboardTable';
import { Task, TaskSubmission } from '@/types';

const ParticipantDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [dailyUpdateContent, setDailyUpdateContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    const submissionsChannel = supabase
      .channel('submissions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'task_submissions' },
        () => fetchSubmissions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchTasks(), fetchSubmissions()]);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      // Transform the data to match our types
      const transformedTasks = (data || []).map(task => ({
        ...task,
        metrics: Array.isArray(task.metrics) ? task.metrics : 
                typeof task.metrics === 'string' ? JSON.parse(task.metrics) : []
      }));
      setTasks(transformedTasks);
    }
  };

  const fetchSubmissions = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('participant_id', profile.id);
    
    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      // Transform the data to match our types
      const transformedSubmissions = (data || []).map(submission => ({
        ...submission,
        scores: typeof submission.scores === 'object' && submission.scores !== null ? 
               submission.scores as Record<string, number> : {}
      }));
      setSubmissions(transformedSubmissions);
    }
  };

  const submitDailyUpdate = async () => {
    if (!profile?.mentor_id || !dailyUpdateContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter your daily update and ensure you have a mentor assigned.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('daily_updates')
      .insert({
        participant_id: profile.id,
        mentor_id: profile.mentor_id,
        content: dailyUpdateContent.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit daily update.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Daily update submitted successfully!",
      });
      setDailyUpdateContent('');
    }
  };

  const getTaskStatus = (task: Task) => {
    const submission = submissions.find(s => s.task_id === task.id);
    if (!submission) return 'not-started';
    return submission.status === 'graded' ? 'completed' : 'pending';
  };

  const getTaskScore = (taskId: string) => {
    const submission = submissions.find(s => s.task_id === taskId);
    return submission?.total_score || 0;
  };

  const completedTasks = submissions.filter(s => s.status === 'graded').length;
  const totalScore = submissions
    .filter(s => s.status === 'graded')
    .reduce((sum, s) => sum + s.total_score, 0);
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.name}!
            </h1>
            <p className="text-gray-600">Track your progress in the SIG AI recruitment</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Participant
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">out of {tasks.length} tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScore}</div>
              <p className="text-xs text-muted-foreground">points earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.length - completedTasks}
              </div>
              <p className="text-xs text-muted-foreground">remaining tasks</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Your Tasks
                </CardTitle>
                <CardDescription>
                  Complete these tasks to progress in the recruitment process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No tasks assigned yet. Check back soon!</p>
                  </div>
                ) : (
                  tasks.map((task) => {
                    const status = getTaskStatus(task);
                    const score = getTaskScore(task.id);
                    
                    return (
                      <div key={task.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                          </div>
                          <div className="ml-4 text-right">
                            {status === 'completed' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Completed - {score} pts
                              </Badge>
                            )}
                            {status === 'pending' && (
                              <Badge variant="secondary">
                                Pending Review
                              </Badge>
                            )}
                            {status === 'not-started' && (
                              <Badge variant="outline">
                                Not Started
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            Max Score: {task.max_score}
                          </div>
                        </div>

                        {task.metrics && task.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {task.metrics.map((metric, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Update Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Daily Update
                </CardTitle>
                <CardDescription>
                  Share your progress with your mentor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Share what you worked on today, challenges faced, and your progress..."
                  value={dailyUpdateContent}
                  onChange={(e) => setDailyUpdateContent(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={submitDailyUpdate}
                  disabled={!dailyUpdateContent.trim()}
                  className="w-full"
                >
                  Submit Daily Update
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard */}
        <LeaderboardTable />
      </div>
    </div>
  );
};

export default ParticipantDashboard;
