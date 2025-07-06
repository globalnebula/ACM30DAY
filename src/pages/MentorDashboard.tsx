import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  MessageSquare,
  Star,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface Participant {
  id: string;
  name: string;
  username: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  metrics: string[];
}

interface TaskSubmission {
  id: string;
  task_id: string;
  participant_id: string;
  scores: Record<string, number>;
  total_score: number;
  status: 'pending' | 'graded';
  participant: { name: string; username: string };
  task: { title: string };
}

interface DailyUpdate {
  id: string;
  content: string;
  date: string;
  participant: { name: string; username: string };
}

interface ScoringMetric {
  id: string;
  name: string;
  description: string;
  max_points: number;
}

const MentorDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [metrics, setMetrics] = useState<ScoringMetric[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const submissionsChannel = supabase
      .channel('mentor-submissions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'task_submissions' },
        () => fetchSubmissions()
      )
      .subscribe();

    const updatesChannel = supabase
      .channel('mentor-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'daily_updates' },
        () => fetchDailyUpdates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(updatesChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchParticipants(),
      fetchTasks(),
      fetchSubmissions(),
      fetchDailyUpdates(),
      fetchMetrics()
    ]);
    setLoading(false);
  };

  const fetchParticipants = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('mentor_id', profile.id)
      .eq('role', 'participant');
    
    if (error) {
      console.error('Error fetching participants:', error);
    } else {
      setParticipants(data || []);
    }
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
    const { data, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        participant:profiles!participant_id(name, username),
        task:tasks(title)
      `)
      .eq('status', 'pending');
    
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

  const fetchDailyUpdates = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('daily_updates')
      .select(`
        *,
        participant:profiles!participant_id(name, username)
      `)
      .eq('mentor_id', profile.id)
      .order('date', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching daily updates:', error);
    } else {
      setDailyUpdates(data || []);
    }
  };

  const fetchMetrics = async () => {
    const { data, error } = await supabase
      .from('scoring_metrics')
      .select('*');
    
    if (error) {
      console.error('Error fetching metrics:', error);
    } else {
      setMetrics(data || []);
    }
  };

  const handleScoreSubmission = async () => {
    if (!selectedTask || !selectedParticipant || Object.keys(scores).length === 0) {
      toast({
        title: "Error",
        description: "Please select a task, participant, and enter scores.",
        variant: "destructive",
      });
      return;
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    const { error } = await supabase
      .from('task_submissions')
      .upsert({
        task_id: selectedTask,
        participant_id: selectedParticipant,
        scores: scores,
        total_score: totalScore,
        status: 'graded',
        graded_by: profile?.id,
        graded_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit scores.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Scores submitted successfully!",
      });
      setSelectedTask('');
      setSelectedParticipant('');
      setScores({});
      fetchSubmissions();
    }
  };

  const selectedTaskData = tasks.find(t => t.id === selectedTask);

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
              Mentor Dashboard
            </h1>
            <p className="text-gray-600">Manage your assigned participants and score their submissions</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Mentor
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Participants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
              <p className="text-xs text-muted-foreground">participants to mentor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <ClipboardList className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">submissions to grade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyUpdates.length}</div>
              <p className="text-xs text-muted-foreground">daily updates received</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scoring Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Score Submissions
              </CardTitle>
              <CardDescription>
                Grade participant submissions and provide scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-select">Select Task</Label>
                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-select">Select Participant</Label>
                <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name} (@{participant.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTaskData && selectedTaskData.metrics && (
                <div className="space-y-4">
                  <Label>Score Metrics</Label>
                  {selectedTaskData.metrics.map((metricName) => {
                    const metric = metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
                    return (
                      <div key={metricName} className="space-y-2">
                        <Label htmlFor={metricName}>{metricName}</Label>
                        <Input
                          id={metricName}
                          type="number"
                          min="0"
                          max={metric?.max_points || 100}
                          placeholder={`Score out of ${metric?.max_points || 100}`}
                          value={scores[metricName] || ''}
                          onChange={(e) => setScores(prev => ({
                            ...prev,
                            [metricName]: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <Button 
                onClick={handleScoreSubmission} 
                className="w-full"
                disabled={!selectedTask || !selectedParticipant || Object.keys(scores).length === 0}
              >
                Submit Scores
              </Button>
            </CardContent>
          </Card>

          {/* Recent Daily Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Daily Updates
              </CardTitle>
              <CardDescription>
                Latest updates from your participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {dailyUpdates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No daily updates yet</p>
                  </div>
                ) : (
                  dailyUpdates.map((update) => (
                    <div key={update.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {update.participant.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(update.date), 'MMM dd')}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{update.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Pending Submissions
            </CardTitle>
            <CardDescription>
              Submissions waiting for your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending submissions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{submission.task.title}</div>
                      <div className="text-sm text-gray-600">
                        by {submission.participant.name} (@{submission.participant.username})
                      </div>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorDashboard;
