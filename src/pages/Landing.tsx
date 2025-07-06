
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LeaderboardTable from '@/components/LeaderboardTable';
import { Users, Trophy, Target, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';

const Landing: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user && profile) {
      // Redirect to appropriate dashboard
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
    } else {
      navigate('/register');
    }
  };

  const scrollToLeaderboard = () => {
    const leaderboardSection = document.getElementById('leaderboard-section');
    if (leaderboardSection) {
      leaderboardSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center space-y-12">
            <div className="flex justify-center mb-12 fade-in-up">
              <div className="floating-animation">
                <div className="w-24 h-24 luxury-gradient luxury-border rounded-2xl flex items-center justify-center cosmic-glow">
                  <img 
                    src="/lovable-uploads/f8247856-c7b3-49d5-a1e4-2b6617151c3a.png" 
                    alt="ACM Student Chapter Logo" 
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-8 fade-in-up stagger-delay-1">
              <h1 className="text-5xl md:text-7xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-100 to-purple-300 leading-tight">
                ACM Student Chapter
                <br />
                <span className="text-4xl md:text-5xl text-purple-200/80 font-thin">
                  SIG AI Recruitment
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-purple-100/70 max-w-4xl mx-auto leading-relaxed font-light tracking-wide">
                Join the premier artificial intelligence special interest group at Amritapuri. 
                Showcase your skills, collaborate with peers, and shape the future of AI through innovative projects and research.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center pt-8 fade-in-up stagger-delay-2">
              <button 
                className="luxury-button text-purple-100 text-lg"
                onClick={handleGetStarted}
              >
                {user ? 'Enter Dashboard' : 'Begin Your Journey'}
                <ArrowRight className="ml-3 w-5 h-5 inline-block" />
              </button>
              {!user && (
                <>
                  <Link to="/login">
                    <button className="luxury-button bg-transparent border-purple-400/30 text-purple-200 text-lg hover:border-purple-400/50">
                      Access Portal
                    </button>
                  </Link>
                  <button 
                    onClick={scrollToLeaderboard}
                    className="luxury-button bg-transparent border-purple-400/30 text-purple-200 text-lg hover:border-purple-400/50"
                  >
                    <TrendingUp className="mr-3 w-5 h-5 inline-block" />
                    Current Standings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20 fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extralight text-purple-100 mb-6">
              Why Join SIG AI?
            </h2>
            <p className="text-xl text-purple-200/60 font-light">
              Experience comprehensive AI education and hands-on projects
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="luxury-card text-center fade-in-up stagger-delay-1">
              <div className="w-16 h-16 luxury-gradient rounded-2xl flex items-center justify-center mx-auto mb-8 cosmic-glow">
                <Target className="w-8 h-8 text-purple-200" />
              </div>
              <h3 className="text-2xl font-light text-purple-100 mb-6 tracking-wide">
                Skill-Based Assessment
              </h3>
              <p className="text-purple-200/70 leading-relaxed font-light">
                Multi-dimensional evaluation covering technical skills, consistency, and teamwork abilities
              </p>
            </div>
            
            <div className="luxury-card text-center fade-in-up stagger-delay-2">
              <div className="w-16 h-16 luxury-gradient rounded-2xl flex items-center justify-center mx-auto mb-8 cosmic-glow">
                <Users className="w-8 h-8 text-purple-200" />
              </div>
              <h3 className="text-2xl font-light text-purple-100 mb-6 tracking-wide">
                Mentorship Program
              </h3>
              <p className="text-purple-200/70 leading-relaxed font-light">
                Get guidance from experienced mentors and collaborate with like-minded AI enthusiasts
              </p>
            </div>
            
            <div className="luxury-card text-center fade-in-up stagger-delay-3">
              <div className="w-16 h-16 luxury-gradient rounded-2xl flex items-center justify-center mx-auto mb-8 cosmic-glow">
                <Trophy className="w-8 h-8 text-purple-200" />
              </div>
              <h3 className="text-2xl font-light text-purple-100 mb-6 tracking-wide">
                Real-time Tracking
              </h3>
              <p className="text-purple-200/70 leading-relaxed font-light">
                Monitor your progress with live leaderboards and detailed performance analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="fade-in-up">
              <h2 className="text-4xl md:text-5xl font-extralight text-purple-100 mb-8">
                Recruitment Process
              </h2>
              <p className="text-xl text-purple-200/70 mb-12 leading-relaxed font-light">
                Our comprehensive selection process is designed to identify passionate individuals 
                who demonstrate both technical excellence and collaborative spirit in AI research and development.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-6 smooth-transition hover:transform hover:translate-x-2">
                  <CheckCircle className="w-7 h-7 text-purple-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-light text-xl text-purple-100 mb-2">Task-Based Evaluation</h4>
                    <p className="text-purple-200/70 leading-relaxed">Complete hands-on projects demonstrating AI/ML skills</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6 smooth-transition hover:transform hover:translate-x-2">
                  <CheckCircle className="w-7 h-7 text-purple-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-light text-xl text-purple-100 mb-2">Mentor Assessment</h4>
                    <p className="text-purple-200/70 leading-relaxed">Regular feedback and scoring from experienced mentors</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6 smooth-transition hover:transform hover:translate-x-2">
                  <CheckCircle className="w-7 h-7 text-purple-300 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-light text-xl text-purple-100 mb-2">Continuous Monitoring</h4>
                    <p className="text-purple-200/70 leading-relaxed">Track progress through daily updates and milestone reviews</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="luxury-card fade-in-up stagger-delay-2">
              <h3 className="text-2xl font-light text-purple-100 mb-8 tracking-wide">Selection Criteria</h3>
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200/80 font-light">Technical Skills</span>
                    <span className="text-purple-300 text-sm">80%</span>
                  </div>
                  <div className="w-full bg-purple-950/30 rounded-full h-2 luxury-border">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-300 h-2 rounded-full w-4/5 smooth-transition"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200/80 font-light">Consistency</span>
                    <span className="text-purple-300 text-sm">75%</span>
                  </div>
                  <div className="w-full bg-purple-950/30 rounded-full h-2 luxury-border">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-300 h-2 rounded-full w-3/4 smooth-transition"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200/80 font-light">Teamwork</span>
                    <span className="text-purple-300 text-sm">80%</span>
                  </div>
                  <div className="w-full bg-purple-950/30 rounded-full h-2 luxury-border">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-300 h-2 rounded-full w-4/5 smooth-transition"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard-section" className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20 fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extralight text-purple-100 mb-6">
              Current Standings
            </h2>
            <p className="text-xl text-purple-200/60 font-light">
              See how participants are performing in real-time
            </p>
          </div>
          
          <div className="fade-in-up stagger-delay-2">
            <LeaderboardTable />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
