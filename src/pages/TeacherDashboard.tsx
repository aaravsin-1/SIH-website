import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StudentRegistrationDialog } from "@/components/StudentRegistrationDialog";
import { CounselorGroupManagement } from "@/components/CounselorGroupManagement";
import { TeacherStudentList } from "@/components/TeacherStudentList";
import { TeacherStatsOverview } from "@/components/TeacherStatsOverview";
import { StudentAppointmentManagement } from "@/components/StudentAppointmentManagement";
import { WellnessArticleManagement } from "@/components/WellnessArticleManagement";
import { SelfCareActivityManagement } from "@/components/SelfCareActivityManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, BookOpen, MessageSquare, Shield, FileText, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
const TeacherDashboard = () => {
  const {
    user,
    loading,
    userRole
  } = useAuth();
  const navigate = useNavigate();
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [groupManagementOpen, setGroupManagementOpen] = useState(false);
  const [wellnessArticlesOpen, setWellnessArticlesOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [selfCareActivitiesOpen, setSelfCareActivitiesOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  if (loading) {
    return <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your teacher dashboard...</p>
        </div>
      </div>;
  }
  if (!user || userRole !== 'teacher') {
    navigate('/auth');
    return null;
  }
  const handleStudentRegistered = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  return <div className="min-h-screen bg-gradient-subtle">
      <DashboardHeader userName={`Prof. ${user.user_metadata?.first_name || "Teacher"}`} notifications={0} isTeacher />
      
      {/* Hero Section */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Teacher Wellness Dashboard
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Support your students' mental health and well-being with professional tools and resources
            </p>
            <Button onClick={() => setRegistrationDialogOpen(true)} className="bg-primary hover:bg-primary-glow">
              <UserPlus className="w-4 h-4 mr-2" />
              Register New Student
            </Button>
          </div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {/* Stats Overview */}
        <TeacherStatsOverview refreshTrigger={refreshTrigger} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Student List */}
          <div className="lg:col-span-2 space-y-6">
            <TeacherStudentList refreshTrigger={refreshTrigger} onStudentRemoved={handleStudentRegistered} />
          </div>

          {/* Right Column - Tools & Resources */}
          <div className="space-y-6">
            {/* Quick Tools */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="wellness-card cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20" onClick={() => setWellnessArticlesOpen(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Resource Library</h3>
                      <p className="text-xs text-muted-foreground">Manage wellness articles</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Manage</Badge>
                </CardContent>
              </Card>

              <Card className="wellness-card cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-wellness-focus/20 to-wellness-focus/30 border-wellness-focus/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-wellness-focus/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-wellness-focus" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Student Reports</h3>
                      <p className="text-xs text-muted-foreground">Generate insights</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Weekly</Badge>
                </CardContent>
              </Card>

              <Card className="wellness-card cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-wellness-energy/20 to-wellness-energy/30 border-wellness-energy/30" onClick={() => setSelfCareActivitiesOpen(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-wellness-energy/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-wellness-energy" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Manage Self-Care Activities</h3>
                      <p className="text-xs text-muted-foreground">Create wellness programs</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Activities</Badge>
                </CardContent>
              </Card>

              <Card className="wellness-card cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-primary/20 to-primary/30 border-primary/30" onClick={() => setGroupManagementOpen(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Peer Groups</h3>
                      <p className="text-xs text-muted-foreground">Manage support communities</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </CardContent>
              </Card>

              <Card className="wellness-card cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-wellness-calm/20 to-wellness-calm/30 border-wellness-calm/30" onClick={() => setAppointmentsOpen(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-wellness-calm/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-wellness-calm" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Student Appointments</h3>
                      <p className="text-xs text-muted-foreground">Manage counseling sessions</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Schedule</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Training & Resources */}
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              
              
            </Card>
          </div>
        </div>
      </main>

      <StudentRegistrationDialog open={registrationDialogOpen} onOpenChange={setRegistrationDialogOpen} onStudentRegistered={handleStudentRegistered} />
      
      <CounselorGroupManagement isOpen={groupManagementOpen} onClose={() => setGroupManagementOpen(false)} onGroupsUpdated={handleStudentRegistered} />

      <Dialog open={wellnessArticlesOpen} onOpenChange={setWellnessArticlesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Wellness Articles Management</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <WellnessArticleManagement />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentsOpen} onOpenChange={setAppointmentsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Student Appointments Management</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <StudentAppointmentManagement />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selfCareActivitiesOpen} onOpenChange={setSelfCareActivitiesOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Self-Care Activities Management</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <SelfCareActivityManagement />
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default TeacherDashboard;