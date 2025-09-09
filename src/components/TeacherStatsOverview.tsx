import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Calendar
} from 'lucide-react';

interface TeacherStats {
  totalStudents: number;
  wellnessAlerts: number;
  weeklyProgress: number;
  upcomingAppointments: number;
}

interface TeacherStatsOverviewProps {
  refreshTrigger: number;
}

export const TeacherStatsOverview = ({ refreshTrigger }: TeacherStatsOverviewProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    wellnessAlerts: 0,
    weeklyProgress: 0,
    upcomingAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get total students count
      const { count: totalStudents } = await supabase
        .from('teacher_student_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      // Get student IDs for this teacher
      const { data: relationships } = await supabase
        .from('teacher_student_relationships')
        .select('student_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      const studentIds = relationships?.map(r => r.student_id) || [];

      let wellnessAlerts = 0;
      let weeklyProgress = 0;
      let upcomingAppointments = 0;

      if (studentIds.length > 0) {
        // Count wellness alerts (students with weekly average mood <= 2 out of 5)
        let criticalStudents = 0;
        
        for (const studentId of studentIds) {
          // Get all mood entries for this student in the past week
          const { data: weeklyMoods } = await supabase
            .from('mood_entries')
            .select('mood_value')
            .eq('user_id', studentId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            
          // Calculate weekly average for this student
          if (weeklyMoods && weeklyMoods.length > 0) {
            const averageMood = weeklyMoods.reduce((sum, entry) => sum + entry.mood_value, 0) / weeklyMoods.length;
            if (averageMood <= 2) {
              criticalStudents++;
            }
          }
        }
        
        wellnessAlerts = criticalStudents;

        // Calculate weekly progress (percentage of students who logged mood this week)
        const { data: studentsWithRecentMood } = await supabase
          .from('mood_entries')
          .select('user_id')
          .in('user_id', studentIds)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          
        const uniqueActiveStudents = new Set(studentsWithRecentMood?.map(entry => entry.user_id) || []);
        weeklyProgress = totalStudents ? Math.round(uniqueActiveStudents.size / totalStudents * 100) : 0;

        // Count confirmed appointments for all students
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .in('user_id', studentIds)
          .eq('status', 'confirmed')
          .gte('scheduled_at', new Date().toISOString());

        upcomingAppointments = appointmentCount || 0;
      }

      setStats({
        totalStudents: totalStudents || 0,
        wellnessAlerts,
        weeklyProgress,
        upcomingAppointments
      });

    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, refreshTrigger]);

  const statCards = [
    {
      title: 'Students Monitored',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Critical Mood Alerts',
      value: stats.wellnessAlerts.toString(),
      icon: AlertTriangle,
      color: stats.wellnessAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'
    },
    {
      title: 'Weekly Engagement',
      value: `${stats.weeklyProgress}%`,
      icon: TrendingUp,
      color: stats.weeklyProgress >= 70 ? 'text-wellness-balance' : stats.weeklyProgress >= 50 ? 'text-accent' : 'text-destructive'
    },
    {
      title: 'Confirmed Appointments',
      value: stats.upcomingAppointments.toString(),
      icon: Calendar,
      color: 'text-primary'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-card/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};