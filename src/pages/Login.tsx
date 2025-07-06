
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for email confirmation success
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    
    if (type === 'signup' && accessToken) {
      toast({
        title: "Email Confirmed!",
        description: "Your email has been confirmed. You can now sign in.",
      });
      // Clean up URL
      navigate('/login', { replace: true });
    }
  }, [location, navigate, toast]);

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (user && profile) {
      const redirectTo = location.state?.from || getDashboardPath();
      navigate(redirectTo, { replace: true });
    }
  }, [user, profile, navigate, location]);

  const getDashboardPath = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'admin':
        return '/admin';
      case 'mentor':
        return '/mentor';
      case 'participant':
        return '/participant';
      default:
        return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Navigation will be handled by the useEffect above
      }
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-extralight text-purple-100 mb-2 tracking-wide">Welcome Back</h1>
          <p className="text-purple-200/60 font-light">Sign in to your ACM SIG AI account</p>
        </div>

        <Card className="luxury-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-purple-100 font-light">Sign In</CardTitle>
            <CardDescription className="text-center text-purple-200/60">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-200/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-purple-200/60">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-purple-300 hover:text-purple-200 smooth-transition">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
