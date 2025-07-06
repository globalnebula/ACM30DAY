import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Settings, 
  BarChart3,
  Calendar,
  Trophy,
  Target,
  UserPlus,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  username: string;
  role: 'participant' | 'mentor' | 'admin';
  mentor_id?: string;
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

interface ScoringMetric {
  id: string;
  name: string;
  description: string;
  max_points: number;
}

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<ScoringMetric[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
    metrics: [] as string[]
  });
  
  // Metric form state
  const [metricForm, setMetricForm] = useState({
    name: '',
    description: '',
    max_points: 100
  });

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const usersChannel = supabase
      .channel('admin-users')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchUsers()
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('admin-tasks')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    const metricsChannel = supabase
      .channel('admin-metrics')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'scoring_metrics' },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchTasks(), fetchMetrics()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
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

  const fetchMetrics = async () => {
    const { data, error } = await supabase
      .from('scoring_metrics')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching metrics:', error);
    } else {
      setMetrics(data || []);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskForm.title || !taskForm.description || !taskForm.due_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      ...taskForm,
      metrics: JSON.stringify(taskForm.metrics)
    };

    let error;
    if (editingTask) {
      ({ error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask));
    } else {
      ({ error } = await supabase
        .from('tasks')
        .insert([taskData]));
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save task.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Task ${editingTask ? 'updated' : 'created'} successfully!`,
      });
      setTaskForm({ title: '', description: '', due_date: '', max_score: 100, metrics: [] });
      setEditingTask(null);
      fetchTasks();
    }
  };

  const handleMetricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!metricForm.name || !metricForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    let error;
    if (editingMetric) {
      ({ error } = await supabase
        .from('scoring_metrics')
        .update(metricForm)
        .eq('id', editingMetric));
    } else {
      ({ error } = await supabase
        .from('scoring_metrics')
        .insert([metricForm]));
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save metric.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Metric ${editingMetric ? 'updated' : 'created'} successfully!`,
      });
      setMetricForm({ name: '', description: '', max_points: 100 });
      setEditingMetric(null);
      fetchMetrics();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
      fetchTasks();
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;

    const { error } = await supabase
      .from('scoring_metrics')
      .delete()
      .eq('id', metricId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete metric.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Metric deleted successfully!",
      });
      fetchMetrics();
    }
  };

  const handleAssignMentor = async (participantId: string, mentorId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ mentor_id: mentorId })
      .eq('id', participantId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign mentor.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Mentor assigned successfully!",
      });
      fetchUsers();
    }
  };

  const startEditTask = (task: Task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      max_score: task.max_score,
      metrics: Array.isArray(task.metrics) ? task.metrics : []
    });
    setEditingTask(task.id);
  };

  const startEditMetric = (metric: ScoringMetric) => {
    setMetricForm({
      name: metric.name,
      description: metric.description,
      max_points: metric.max_points
    });
    setEditingMetric(metric.id);
  };

  const participants = users.filter(u => u.role === 'participant');
  const mentors = users.filter(u => u.role === 'mentor');
  const admins = users.filter(u => u.role === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage tasks, users, and recruitment process</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Administrator
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
              <p className="text-xs text-muted-foreground">registered participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
              <UserPlus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mentors.length}</div>
              <p className="text-xs text-muted-foreground">available mentors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">recruitment tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scoring Metrics</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.length}</div>
              <p className="text-xs text-muted-foreground">evaluation criteria</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </CardTitle>
              <CardDescription>
                {editingTask ? 'Update task details' : 'Add a new recruitment task'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed task description"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-max-score">Max Score</Label>
                    <Input
                      id="task-max-score"
                      type="number"
                      min="1"
                      value={taskForm.max_score}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Scoring Metrics</Label>
                  <div className="space-y-2">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric.id}
                          checked={taskForm.metrics.includes(metric.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTaskForm(prev => ({
                                ...prev,
                                metrics: [...prev.metrics, metric.name]
                              }));
                            } else {
                              setTaskForm(prev => ({
                                ...prev,
                                metrics: prev.metrics.filter(m => m !== metric.name)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={metric.id} className="text-sm">
                          {metric.name} ({metric.max_points} pts)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                  {editingTask && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTask(null);
                        setTaskForm({ title: '', description: '', due_date: '', max_score: 100, metrics: [] });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Metric Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {editingMetric ? 'Edit Metric' : 'Create Scoring Metric'}
              </CardTitle>
              <CardDescription>
                {editingMetric ? 'Update metric details' : 'Define evaluation criteria'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMetricSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metric-name">Metric Name</Label>
                  <Input
                    id="metric-name"
                    value={metricForm.name}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Technical Skills"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metric-description">Description</Label>
                  <Textarea
                    id="metric-description"
                    value={metricForm.description}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of what this metric evaluates"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metric-max-points">Maximum Points</Label>
                  <Input
                    id="metric-max-points"
                    type="number"
                    min="1"
                    value={metricForm.max_points}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, max_points: parseInt(e.target.value) || 100 }))}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingMetric ? 'Update Metric' : 'Create Metric'}
                  </Button>
                  {editingMetric && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingMetric(null);
                        setMetricForm({ name: '', description: '', max_points: 100 });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recruitment Tasks
            </CardTitle>
            <CardDescription>
              Manage and monitor all recruitment tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks created yet. Create your first task above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditTask(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({participants.length})
              </CardTitle>
              <CardDescription>
                Manage participant assignments and mentoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-gray-500">@{participant.username}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={participant.mentor_id || 'unassigned'}
                        onValueChange={(value) => {
                          if (value !== 'unassigned') {
                            handleAssignMentor(participant.id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign mentor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">No mentor</SelectItem>
                          {mentors.map((mentor) => (
                            <SelectItem key={mentor.id} value={mentor.id}>
                              {mentor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Scoring Metrics ({metrics.length})
              </CardTitle>
              <CardDescription>
                Available evaluation criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-gray-500">{metric.description}</div>
                      <div className="text-xs text-gray-400 mt-1">Max: {metric.max_points} pts</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditMetric(metric)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMetric(metric.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
