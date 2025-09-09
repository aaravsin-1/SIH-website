import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Target, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const WellnessStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    weeklyGoal: 70,
    currentProgress: 0,
    streak: 0,
    sessionsThisWeek: 0,
    totalSessions: 0,
    averageMood: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      // Get mood entries for streak calculation
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('date, mood_value')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Get wellness sessions for this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const { data: weekSessions } = await supabase
        .from('wellness_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString());

      // Get activity completions for this week with actual duration
      const { data: weekActivityCompletions } = await supabase
        .from('activity_completions')
        .select('completed_at, actual_duration_minutes')
        .eq('user_id', user.id)
        .gte('completed_at', startOfWeek.toISOString());

      // Get total sessions and activity completions
      const { data: allSessions } = await supabase
        .from('wellness_sessions')
        .select('id, duration_minutes')
        .eq('user_id', user.id);

      const { data: allActivityCompletions } = await supabase
        .from('activity_completions')
        .select('id, actual_duration_minutes')
        .eq('user_id', user.id);

      // Calculate stats
      const sessionMinutes = weekSessions?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
      const activityMinutes = weekActivityCompletions?.reduce((sum, completion) => {
        return sum + (completion.actual_duration_minutes || 0);
      }, 0) || 0;
      
      const weeklyProgress = sessionMinutes + activityMinutes;
      const totalSessions = (allSessions?.length || 0) + (allActivityCompletions?.length || 0);
      const averageMood = moodEntries?.length > 0 
        ? moodEntries.reduce((sum, entry) => sum + entry.mood_value, 0) / moodEntries.length 
        : 0;

      // Calculate streak (consecutive days with mood entries)
      let streak = 0;
      if (moodEntries?.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        let currentDate = new Date();
        
        for (const entry of moodEntries) {
          const entryDate = entry.date;
          const expectedDate = currentDate.toISOString().split('T')[0];
          
          if (entryDate === expectedDate) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (entryDate < expectedDate) {
            break;
          }
        }
      }

      setStats({
        weeklyGoal: 50,
        currentProgress: weeklyProgress,
        streak,
        sessionsThisWeek: (weekSessions?.length || 0) + (weekActivityCompletions?.length || 0),
        totalSessions,
        averageMood: Math.round(averageMood * 10) / 10
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-muted rounded mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Weekly Wellness Goal
          </CardTitle>
          <CardDescription>Keep up the great progress!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{stats.currentProgress}/{stats.weeklyGoal} minutes</span>
            </div>
            <Progress 
              value={(stats.currentProgress / stats.weeklyGoal) * 100} 
              className="h-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.sessionsThisWeek}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Your Wellness Journey
          </CardTitle>
          <CardDescription>You're making amazing progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-wellness-calm/20 rounded-lg">
              <div className="text-xl font-bold text-foreground">{stats.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center p-3 bg-wellness-energy/20 rounded-lg">
              <div className="text-xl font-bold text-foreground">{stats.averageMood > 0 ? stats.averageMood : 'N/A'}/5</div>
              <div className="text-xs text-muted-foreground">Average Mood</div>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              <Calendar className="w-3 h-3 mr-1" />
              Active Member Since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};