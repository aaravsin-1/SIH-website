import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfileDialog } from './StudentProfileDialog';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  Phone,
  School,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  X,
  UserMinus
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

interface TeacherStudentListProps {
  refreshTrigger: number;
  onStudentRemoved?: () => void;
}

export const TeacherStudentList = ({ refreshTrigger, onStudentRemoved }: TeacherStudentListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  const fetchStudents = async () => {
    if (!user) return;

    try {
      // First, get the teacher-student relationships
      const { data: relationships, error: relationError } = await supabase
        .from('teacher_student_relationships')
        .select('student_id, student_phone, assigned_at, notes')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (relationError) {
        console.error('Error fetching relationships:', relationError);
        return;
      }

      if (!relationships || relationships.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      const studentIds = relationships.map(r => r.student_id);

      // Get student info for all students
      const { data: studentsInfo, error: infoError } = await supabase
        .from('student_info')
        .select('user_id, first_name, last_name, email, college_name, course, year_of_study, guardian_phone')
        .in('user_id', studentIds);

      if (infoError) {
        console.error('Error fetching student info:', infoError);
        return;
      }

      // For each student, get their wellness data
      const studentsWithWellness = await Promise.all(
        relationships.map(async (relation) => {
          const studentId = relation.student_id;
          const studentInfo = studentsInfo?.find(info => info.user_id === studentId);
          
          if (!studentInfo) {
            return null;
          }

          // Get latest mood entry
          const { data: latestMood } = await supabase
            .from('mood_entries')
            .select('mood_value, created_at')
            .eq('user_id', studentId)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get weekly mood entries count
          const { count: weeklyCount } = await supabase
            .from('mood_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', studentId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          // Get average weekly mood
          const { data: weeklyMoods } = await supabase
            .from('mood_entries')
            .select('mood_value')
            .eq('user_id', studentId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          const avgWeeklyMood = weeklyMoods && weeklyMoods.length > 0
            ? weeklyMoods.reduce((sum, entry) => sum + entry.mood_value, 0) / weeklyMoods.length
            : null;

          // Get recent appointments
          const { count: appointmentCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', studentId)
            .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          return {
            student_id: studentId,
            first_name: studentInfo.first_name || '',
            last_name: studentInfo.last_name || '',
            email: studentInfo.email || '',
            college_name: studentInfo.college_name || '',
            course: studentInfo.course || '',
            year_of_study: studentInfo.year_of_study || '',
            student_phone: relation.student_phone,
            guardian_phone: studentInfo.guardian_phone || '',
            latest_mood: latestMood?.[0]?.mood_value || null,
            latest_mood_date: latestMood?.[0]?.created_at || null,
            weekly_mood_entries: weeklyCount || 0,
            avg_weekly_mood: avgWeeklyMood,
            recent_appointments: appointmentCount || 0,
            assigned_at: relation.assigned_at,
            teacher_notes: relation.notes || ''
          };
        })
      );

      // Filter out null results and set the students
      const validStudents = studentsWithWellness.filter((student): student is StudentData => student !== null);
      setStudents(validStudents);
      setFilteredStudents(validStudents);

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error loading students",
        description: "Unable to load student data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, refreshTrigger]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.first_name.toLowerCase().includes(term) ||
        student.last_name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.student_phone.includes(term) ||
        student.course.toLowerCase().includes(term) ||
        student.college_name.toLowerCase().includes(term)
      );
    }

    // Apply mood filter
    if (moodFilter !== 'all') {
      filtered = filtered.filter(student => {
        // Use weekly average mood for filtering, fall back to latest mood
        const moodValue = student.avg_weekly_mood !== null ? student.avg_weekly_mood : student.latest_mood;
        
        if (moodFilter === 'critical' && moodValue !== null) {
          return moodValue <= 2; // Critical: <= 2 out of 5
        }
        if (moodFilter === 'neutral' && moodValue !== null) {
          return moodValue > 2 && moodValue <= 3.5; // Neutral: 2-3.5 out of 5
        }
        if (moodFilter === 'good' && moodValue !== null) {
          return moodValue > 3.5; // Good: > 3.5 out of 5
        }
        if (moodFilter === 'no-data') {
          return moodValue === null;
        }
        return true;
      });
    }

    // Apply appointment filter
    if (appointmentFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (appointmentFilter === 'has-appointments') {
          return student.recent_appointments > 0;
        }
        if (appointmentFilter === 'no-appointments') {
          return student.recent_appointments === 0;
        }
        return true;
      });
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, moodFilter, appointmentFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setMoodFilter('all');
    setAppointmentFilter('all');
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('teacher_student_relationships')
        .delete()
        .eq('teacher_id', user.id)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error removing student:', error);
        toast({
          title: "Error removing student",
          description: "Unable to remove student. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Student removed successfully",
        description: `${studentName} has been removed from your student list.`,
      });

      // Refresh the student list
      await fetchStudents();
      onStudentRemoved?.();

    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error removing student",
        description: "Unable to remove student. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getMoodBadge = (mood: number | null, avgMood: number | null) => {
    // Use weekly average mood for categorization, fall back to latest mood
    const moodValue = avgMood !== null ? avgMood : mood;
    
    if (moodValue === null) {
      return <Badge variant="outline">No Data</Badge>;
    }
    
    // Categorize based on values out of 5
    if (moodValue <= 2) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Critical ({moodValue.toFixed(1)}/5)
      </Badge>;
    } else if (moodValue <= 3.5) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Minus className="w-3 h-3" />
        Neutral ({moodValue.toFixed(1)}/5)
      </Badge>;
    } else {
      return <Badge variant="secondary" className="bg-wellness-balance/20 text-wellness-balance flex items-center gap-1">
        <UserCheck className="w-3 h-3" />
        Good ({moodValue.toFixed(1)}/5)
      </Badge>;
    }
  };

  const getTrendIcon = (avgMood: number | null) => {
    if (!avgMood) return <Minus className="w-4 h-4 text-muted-foreground" />;
    
    if (avgMood > 3.5) {
      return <TrendingUp className="w-4 h-4 text-wellness-balance" />;
    } else if (avgMood < 2) {
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    } else {
      return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Students ({filteredStudents.length} of {students.length})
            </CardTitle>
            <CardDescription>
              Monitor wellness status and progress of your registered students
            </CardDescription>
          </div>
          
          {(searchTerm || moodFilter !== 'all' || appointmentFilter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={moodFilter} onValueChange={setMoodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moods</SelectItem>
              <SelectItem value="critical">Critical (≤2)</SelectItem>
              <SelectItem value="neutral">Neutral (2-3.5)</SelectItem>
              <SelectItem value="good">Good (&gt;3.5)</SelectItem>
              <SelectItem value="no-data">No Data</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by appointments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="has-appointments">Has Appointments</SelectItem>
              <SelectItem value="no-appointments">No Appointments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Registered</h3>
            <p className="text-muted-foreground">
              Register students by their phone number to start monitoring their wellness.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Match Your Filters</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters to see more results.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStudents.map((student) => (
              <Card 
                key={student.student_id} 
                className="border border-border/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background to-background/95"
              >
                <CardContent className="p-5">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="flex-1 cursor-pointer group"
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsProfileOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {student.first_name} {student.last_name} from your student list? 
                            This will deactivate the relationship but preserve all existing data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveStudent(student.student_id, `${student.first_name} ${student.last_name}`)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove Student
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    {getMoodBadge(student.latest_mood, student.avg_weekly_mood)}
                  </div>

                  {/* Contact & Academic Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <School className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{student.course.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{student.year_of_study}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Phone className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{student.student_phone}</p>
                        <p className="text-xs text-muted-foreground">Student Phone</p>
                      </div>
                    </div>
                  </div>

                  {/* Wellness Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-gradient-to-b from-primary/5 to-primary/10 border border-primary/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getTrendIcon(student.avg_weekly_mood)}
                        <span className="font-semibold text-lg">
                          {student.avg_weekly_mood ? student.avg_weekly_mood.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Weekly Avg</p>
                    </div>

                    <div className="text-center p-3 rounded-lg bg-gradient-to-b from-accent/5 to-accent/10 border border-accent/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span className="font-semibold text-lg">{student.weekly_mood_entries}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Check-ins</p>
                    </div>

                    <div className="text-center p-3 rounded-lg bg-gradient-to-b from-wellness-calm/5 to-wellness-calm/10 border border-wellness-calm/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="w-4 h-4 text-wellness-calm" />
                        <span className="font-semibold text-lg">{student.recent_appointments}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Sessions</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {student.teacher_notes && (
                    <div className="mt-4 p-3 bg-muted/40 rounded-lg border-l-4 border-primary/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{student.teacher_notes}</p>
                    </div>
                  )}

                  {student.latest_mood_date && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                      Last mood entry: {new Date(student.latest_mood_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      
      <StudentProfileDialog
        student={selectedStudent}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedStudent(null);
        }}
      />
    </Card>
  );
};