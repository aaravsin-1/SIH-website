import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  User, 
  School, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Heart,
  BookOpen,
  MapPin
} from 'lucide-react';

interface StudentData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  college_name: string;
  course: string;
  year_of_study: string;
  student_phone: string;
  guardian_phone: string;
  latest_mood: number | null;
  latest_mood_date: string | null;
  weekly_mood_entries: number;
  avg_weekly_mood: number | null;
  recent_appointments: number;
  assigned_at: string;
  teacher_notes: string;
}

interface MoodEntry {
  date: string;
  mood_value: number;
  created_at: string;
}

interface StudentProfileDialogProps {
  student: StudentData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileDialog = ({ student, isOpen, onClose }: StudentProfileDialogProps) => {
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      fetchStudentData();
    }
  }, [student, isOpen]);

  const fetchStudentData = async () => {
    if (!student) return;
    
    setLoading(true);
    try {
      // Fetch detailed student information
      const { data: details } = await supabase
        .from('student_info')
        .select('*')
        .eq('user_id', student.student_id)
        .single();

      setStudentDetails(details);

      // Fetch mood entries for the last 30 days using the date column
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: moods } = await supabase
        .from('mood_entries')
        .select('date, mood_value, created_at')
        .eq('user_id', student.student_id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setMoodData(moods || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood <= 2) return '#ef4444'; // red-500
    if (mood <= 3) return '#f97316'; // orange-500
    if (mood <= 4) return '#eab308'; // yellow-500
    if (mood <= 6) return '#22c55e'; // green-500
    return '#10b981'; // emerald-500
  };

  const formatChartData = (data: MoodEntry[]) => {
    return data.map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: entry.mood_value,
      fullDate: entry.date
    }));
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {student.first_name} {student.last_name} - Student Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Email:</strong> {student.email || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {student.student_phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Guardian:</strong> {student.guardian_phone || 'Not provided'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Assigned:</strong> {new Date(student.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                  {studentDetails?.preferred_pronouns && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Pronouns:</strong> {studentDetails.preferred_pronouns}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-4 h-4" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>College:</strong> {student.college_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Course:</strong> {student.course}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Year:</strong> {student.year_of_study}
                    </span>
                  </div>
                  {studentDetails?.student_id && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Student ID:</strong> {studentDetails.student_id}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wellness Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Wellness Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {student.latest_mood || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Latest Mood</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-wellness-balance">
                      {student.avg_weekly_mood ? student.avg_weekly_mood.toFixed(1) : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">Weekly Average</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-wellness-energy">
                      {student.weekly_mood_entries}
                    </div>
                    <p className="text-sm text-muted-foreground">Daily Entries (7d)</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-wellness-calm">
                      {student.recent_appointments}
                    </div>
                    <p className="text-sm text-muted-foreground">Recent Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood Tracking Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Mood Tracking (Last 30 Days)
                </CardTitle>
                <CardDescription>
                  Daily mood entries on a scale of 1-5
                </CardDescription>
              </CardHeader>
              <CardContent>
                {moodData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(moodData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          domain={[1, 5]}
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="mood" 
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No mood data available for the last 30 days</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teacher Notes */}
            {student.teacher_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{student.teacher_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};