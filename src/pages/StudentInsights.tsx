import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Brain, TrendingUp, Calendar, Activity, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  college_name: string;
  course: string;
  year_of_study: string;
  phone: string;
  guardian_phone: string;
}

interface MoodEntry {
  mood_value: number;
  created_at: string;
  date: string;
}

interface ActivityCompletion {
  actual_duration_minutes: number;
  completed_at: string;
  mood_before?: number;
  mood_after?: number;
}

interface Appointment {
  id: string;
  appointment_type: string;
  scheduled_at: string;
  status: string;
  counselor_name?: string;
}

const StudentInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activityCompletions, setActivityCompletions] = useState<ActivityCompletion[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStudents();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentData();
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const { data: relationships } = await supabase
        .from('teacher_student_relationships')
        .select('student_id')
        .eq('teacher_id', user?.id)
        .eq('is_active', true);

      if (relationships && relationships.length > 0) {
        const studentIds = relationships.map(r => r.student_id);
        
        const { data: studentsData } = await supabase
          .from('student_info')
          .select('user_id, first_name, last_name, email, college_name, course, year_of_study, phone, guardian_phone')
          .in('user_id', studentIds);

        setStudents(studentsData || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentData = async () => {
    if (!selectedStudentId) return;
    
    setLoading(true);
    try {
      // Fetch student details
      const student = students.find(s => s.user_id === selectedStudentId);
      setSelectedStudent(student || null);

      // Fetch mood entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood_value, created_at, date')
        .eq('user_id', selectedStudentId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      setMoodEntries(moodData || []);

      // Fetch activity completions (last 30 days)
      const { data: activityData } = await supabase
        .from('activity_completions')
        .select('actual_duration_minutes, completed_at, mood_before, mood_after')
        .eq('user_id', selectedStudentId)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      setActivityCompletions(activityData || []);

      // Fetch appointments
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('id, appointment_type, scheduled_at, status, counselor_name')
        .eq('user_id', selectedStudentId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      setAppointments(appointmentData || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageMood = () => {
    if (moodEntries.length === 0) return 0;
    const sum = moodEntries.reduce((acc, entry) => acc + entry.mood_value, 0);
    return Math.round((sum / moodEntries.length) * 20); // Convert to percentage
  };

  const getMoodTrend = () => {
    if (moodEntries.length < 2) return "stable";
    const recent = moodEntries.slice(0, 5);
    const older = moodEntries.slice(-5);
    
    const recentAvg = recent.reduce((acc, entry) => acc + entry.mood_value, 0) / recent.length;
    const olderAvg = older.reduce((acc, entry) => acc + entry.mood_value, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return "improving";
    if (recentAvg < olderAvg - 0.5) return "declining";
    return "stable";
  };

  const getTotalActivityTime = () => {
    return activityCompletions.reduce((acc, activity) => acc + (activity.actual_duration_minutes || 0), 0);
  };

  const getMoodColor = (value: number) => {
    if (value >= 4) return "bg-green-500";
    if (value >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTrendIcon = () => {
    const trend = getMoodTrend();
    if (trend === "improving") return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "declining") return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <TrendingUp className="w-4 h-4 text-gray-600" />;
  };

  const runAiAnalysis = async () => {
    if (!selectedStudent?.phone) {
      toast({
        title: "No Phone Number",
        description: "Selected student doesn't have a phone number available.",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    setAiAnalysis("");

    try {
      const response = await fetch('https://welcomed-secretly-gnat.ngrok-free.app/webhook/aiinferenece', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: selectedStudent.phone,
          student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          student_id: selectedStudent.user_id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      
      // Clean up the response by removing HTML tags and formatting
      const cleanedResponse = data
        .replace(/"response":\s*"/g, '') // Remove response wrapper
        .replace(/"/g, '') // Remove quotes
        .replace(/<br\s*\/?>/gi, '\n') // Convert <br> tags to line breaks
        .replace(/<strong>(.*?)<\/strong>/gi, '$1') // Remove <strong> tags but keep content
        .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/\n{3,}/g, '\n\n') // Limit multiple line breaks to double
        .trim();
      
      setAiAnalysis(cleanedResponse);
      
      toast({
        title: "AI Analysis Complete",
        description: "The AI analysis has been generated successfully.",
      });
    } catch (error) {
      console.error('Error calling AI analysis webhook:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate AI analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardHeader userName={user?.user_metadata?.first_name || "Teacher"} notifications={0} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/teacher-dashboard')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Student Insights</h1>
        </div>

        {/* Student Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a student to view insights" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.user_id} value={student.user_id}>
                    {student.first_name} {student.last_name} - {student.course} {student.year_of_study}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedStudent && !loading && (
          <div className="space-y-8">
            {/* Student Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Student Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <p className="text-muted-foreground">{selectedStudent.email}</p>
                    <p className="text-muted-foreground">Phone: {selectedStudent.phone}</p>
                    <p className="text-muted-foreground">Guardian: {selectedStudent.guardian_phone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Academic Details</h4>
                    <p className="text-sm text-muted-foreground">Course: {selectedStudent.course}</p>
                    <p className="text-sm text-muted-foreground">Year: {selectedStudent.year_of_study}</p>
                    <p className="text-sm text-muted-foreground">College: {selectedStudent.college_name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <p className="text-sm text-muted-foreground">
                      Last mood entry: {moodEntries[0] ? new Date(moodEntries[0].created_at).toLocaleDateString() : 'None'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Activities completed: {activityCompletions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Wellness Analysis
                  </div>
                  <Button 
                    onClick={runAiAnalysis} 
                    disabled={aiLoading || !selectedStudent?.phone}
                    variant="default"
                    size="sm"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAnalysis ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-primary">Analysis Results</h4>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground bg-muted/50 p-6 rounded-lg border-l-4 border-primary">
                          {aiAnalysis}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Click "Run AI Analysis" to generate insights about this student's wellness patterns</p>
                    {!selectedStudent?.phone && (
                      <p className="text-sm text-destructive mt-2">No phone number available for analysis</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mood Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Average Mood
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{Math.round(getAverageMood())}%</div>
                  <Progress value={getAverageMood()} className="mb-2" />
                  <p className="text-xs text-muted-foreground">Based on last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getTrendIcon()}
                    Mood Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2 capitalize">{getMoodTrend()}</div>
                  <Badge variant={getMoodTrend() === "improving" ? "default" : getMoodTrend() === "declining" ? "destructive" : "secondary"}>
                    {getMoodTrend()}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{getTotalActivityTime()}m</div>
                  <p className="text-xs text-muted-foreground">Total self-care time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{appointments.length}</div>
                  <p className="text-xs text-muted-foreground">Total scheduled</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Mood Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Mood Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {moodEntries.length > 0 ? (
                  <div className="space-y-3">
                    {moodEntries.slice(0, 10).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood_value)}`} />
                          <span className="font-medium">Mood: {entry.mood_value}/5</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No mood entries recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{appointment.appointment_type}</div>
                          {appointment.counselor_name && (
                            <div className="text-sm text-muted-foreground">with {appointment.counselor_name}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                            {appointment.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(appointment.scheduled_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No appointments scheduled</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading student insights...</p>
          </div>
        )}

        {!selectedStudentId && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a Student</h2>
            <p className="text-muted-foreground">Choose a student from the dropdown above to view their wellness insights and progress.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInsights;