
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, UserCheck, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isAdminRegister = location.pathname === '/admin-register';
  const isMentorRegister = location.pathname === '/mentor-register';
  
  const getRole = () => {
    if (isAdminRegister) return 'admin';
    if (isMentorRegister) return 'mentor';
    return 'participant';
  };

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (user && profile) {
      switch (profile.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'mentor':
          navigate('/mentor');
          break;
        case 'participant':
          navigate('/participant');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, profile, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error", 
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Please choose a username.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const success = await register({
        ...formData,
        role: getRole(),
      });
      
      if (success) {
        // Navigation will be handled by the useEffect above or by auth state change
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (isAdminRegister) return 'Admin Registration';
    if (isMentorRegister) return 'Mentor Registration';
    return 'Join SIG AI';
  };

  const getDescription = () => {
    if (isAdminRegister) return 'Create an administrator account';
    if (isMentorRegister) return 'Create a mentor account';
    return 'Start your AI journey with ACM Student Chapter';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 luxury-gradient luxury-border rounded-2xl flex items-center justify-center cosmic-glow">
              <img 
                src="/lovable-uploads/f8247856-c7b3-49d5-a1e4-2b6617151c3a.png" 
                alt="ACM Student Chapter Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-extralight text-purple-100 mb-2 tracking-wide">{getTitle()}</h1>
          <p className="text-purple-200/60 font-light">{getDescription()}</p>
        </div>

        <Card className="luxury-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-purple-100 font-light">Create Account</CardTitle>
            <CardDescription className="text-center text-purple-200/60">
              Fill in your details to get started
              {(isAdminRegister || isMentorRegister) && (
                <span className="block text-purple-300 font-medium mt-1">
                  {isAdminRegister ? 'Admin' : 'Mentor'} Registration
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-200/80">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-purple-300/60" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 bg-purple-950/20 border-purple-400/20 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-400/40"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-200/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300/60" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-purple-950/20 border-purple-400/20 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-400/40"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-purple-200/80">Username</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-3 h-4 w-4 text-purple-300/60" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10 bg-purple-950/20 border-purple-400/20 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-400/40"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-200/80">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300/60" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 bg-purple-950/20 border-purple-400/20 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-400/40"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-purple-200/80">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300/60" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 bg-purple-950/20 border-purple-400/20 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-400/40"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full luxury-button mt-6"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {!isAdminRegister && !isMentorRegister && (
              <div className="mt-6 text-center">
                <p className="text-sm text-purple-200/60">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-purple-300 hover:text-purple-200 smooth-transition">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
