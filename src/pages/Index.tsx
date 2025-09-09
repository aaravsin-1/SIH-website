import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { WellnessCard } from "@/components/WellnessCard";
import { MoodTracker } from "@/components/MoodTracker";
import { QuickActions } from "@/components/QuickActions";
import { WellnessStats } from "@/components/WellnessStats";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { MessageCircle, Heart, Users, BookOpen, Calendar, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/wellness-hero.jpg";

const Index = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && userRole === 'teacher') {
      navigate('/teacher-dashboard');
    } else if (!loading && user && userRole === 'student' && !user.user_metadata?.profile_completed) {
      navigate('/student-details');
    }
  }, [user, loading, userRole, navigate]);

  const handleCardClick = (action: string) => {
    switch (action) {
      case "book-counseling":
        navigate('/book-counseling');
        break;
      case "peer-support":
        navigate('/peer-support');
        break;
      case "crisis-support":
        window.open('tel:9152987821', '_self');
        break;
      default:
        console.log(`Clicked: ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardHeader userName={user.user_metadata?.first_name || "Student"} notifications={3} />
      
      {/* Hero Section */}
      <section className="relative px-6 py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroImage} 
            alt="Campus wellness community" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/30"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent leading-tight">
            Take charge of your mental wellness
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Your one-stop digital support system for academic success, mental wellness, and future planning. 
            Confidential, stigma-free, and designed just for you.
          </p>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {/* Quick Stats */}
        <section className="mb-8">
          <WellnessStats />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wellness Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WellnessCard
                title="AI Wellness Advisor"
                description="Get instant, personalized support and coping strategies tailored for you"
                icon={MessageCircle}
                gradient="calm"
                action="Start chatting"
                whatsappNumber="+919560102128"
              />
              
              <WellnessCard
                title="Book Counseling"
                description="Schedule confidential sessions with campus counselors and mental health professionals"
                icon={Calendar}
                gradient="balance"
                action="View availability"
                onClick={() => handleCardClick("book-counseling")}
              />
              
              <WellnessCard
                title="Peer Support Community"
                description="Connect with trained student volunteers and join moderated support forums"
                icon={Users}
                gradient="focus"
                action="Join community"
                onClick={() => handleCardClick("peer-support")}
              />
              
              <WellnessCard
                title="Crisis Support"
                description="Access 24/7 emergency support and campus helplines when you need immediate help"
                icon={Phone}
                gradient="energy"
                action="Get help now"
                onClick={() => handleCardClick("crisis-support")}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </div>

          {/* Right Column - Tracking & Schedule */}
          <div className="space-y-6">
            <MoodTracker />
            <UpcomingAppointments />
          </div>
        </div>

        {/* Bottom Section - Resources */}
        <section className="mt-12 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-accent" />
              Your well-being matters
            </h3>
            <p className="text-muted-foreground">
              Whether you need quick advice, ongoing support, or resources to help you grow - everything is here, 
              confidential and designed for your campus community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Confidential Help Anytime</h4>
              <p className="text-sm text-muted-foreground">Chat privately with our AI advisor or book sessions with counselors</p>
            </div>
            
            <div className="p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Peer Support Network</h4>
              <p className="text-sm text-muted-foreground">Connect with trained student volunteers in a safe, supportive space</p>
            </div>
            
            <div className="p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Personalized Resources</h4>
              <p className="text-sm text-muted-foreground">Get real-time tips and coping strategies tailored specifically for you</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
