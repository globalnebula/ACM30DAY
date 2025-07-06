
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { User, LogOut, Settings, Home } from 'lucide-react';
import { Badge } from './ui/badge';

const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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

  return (
    <nav className="bg-background border-b border-purple-900/20 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 luxury-gradient luxury-border rounded-xl flex items-center justify-center cosmic-glow">
              <img 
                src="/lovable-uploads/f8247856-c7b3-49d5-a1e4-2b6617151c3a.png" 
                alt="ACM Student Chapter Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="font-light text-purple-100 text-lg tracking-wide">ACM SIG AI</div>
              <div className="text-xs text-purple-200/60">Amritapuri Chapter</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-purple-200/70 hover:text-purple-100 smooth-transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            
            {user && profile && (
              <Link 
                to={getDashboardPath()} 
                className="text-purple-200/70 hover:text-purple-100 smooth-transition flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-purple-100">{profile.name}</div>
                      <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                        {profile.role}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-purple-900/20">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-purple-100">{profile.name}</p>
                    <p className="text-xs text-purple-200/60">@{profile.username}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-purple-900/20" />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} className="flex items-center text-purple-200 hover:text-purple-100">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-purple-900/20" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
