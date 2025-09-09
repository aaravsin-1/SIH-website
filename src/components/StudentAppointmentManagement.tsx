import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Edit, Users, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface StudentAppointment {
  id: string;
  appointment_type: string;
  counselor_name: string | null;
  scheduled_at: string;
  status: string | null;
  notes: string | null;
  user_id: string;
  student_name: string;
  student_email: string;
}

interface EditFormData {
  appointmentType: string;
  scheduledAt: string;
  notes: string;
  counselorName: string;
  status: string;
}

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface NewAppointmentFormData {
  studentId: string;
  appointmentType: string;
  scheduledAt: string;
  notes: string;
  counselorName: string;
}

export const StudentAppointmentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<StudentAppointment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<StudentAppointment | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    appointmentType: '',
    scheduledAt: '',
    notes: '',
    counselorName: '',
    status: ''
  });
  const [newAppointmentData, setNewAppointmentData] = useState<NewAppointmentFormData>({
    studentId: '',
    appointmentType: '',
    scheduledAt: '',
    notes: '',
    counselorName: ''
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<string | null>(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);

  const appointmentTypes = [
    'Initial Consultation',
    'Follow-up Session',
    'Crisis Support',
    'Academic Stress',
    'Anxiety Management',
    'Depression Support',
    'Peer Relationship Issues',
    'Family Concerns'
  ];

  const counselors = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen', 
    'Dr. Emily Rodriguez',
    'Dr. James Wilson'
  ];

  const statuses = [
    'scheduled',
    'confirmed',
    'pending',
    'cancelled',
    'completed'
  ];

  useEffect(() => {
    if (user) {
      loadStudentAppointments();
      loadStudents();
    }
  }, [user]);

  const loadStudentAppointments = async () => {
    if (!user) return;
    
    try {
      // Use the alternative approach directly since join syntax is complex
      await loadStudentAppointmentsAlternative();
    } catch (error) {
      console.error('Error loading student appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load student appointments.",
        variant: "destructive"
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAppointmentsAlternative = async () => {
    try {
      // First, get all students assigned to this teacher
      const { data: relationships, error: relError } = await supabase
        .from('teacher_student_relationships')
        .select('student_id')
        .eq('teacher_id', user?.id)
        .eq('is_active', true);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setAppointments([]);
        return;
      }

      const studentIds = relationships.map(rel => rel.student_id);

      // Get appointments for these students
      const { data: appointmentsData, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .in('user_id', studentIds)
        .order('scheduled_at', { ascending: true });

      if (aptError) throw aptError;

      // Get student info for these students
      const { data: studentInfo, error: studentError } = await supabase
        .from('student_info')
        .select('user_id, first_name, last_name, email')
        .in('user_id', studentIds);

      if (studentError) throw studentError;

      // Combine the data
      const appointmentsWithStudentInfo = appointmentsData?.map(apt => {
        const student = studentInfo?.find(s => s.user_id === apt.user_id);
        return {
          ...apt,
          student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          student_email: student?.email || 'unknown@email.com'
        };
      }) || [];

      setAppointments(appointmentsWithStudentInfo);
    } catch (error) {
      console.error('Error in alternative load:', error);
      toast({
        title: "Error",
        description: "Failed to load student appointments.",
        variant: "destructive"
      });
      setAppointments([]);
    }
  };

  const loadStudents = async () => {
    if (!user) return;
    
    try {
      // Get all students assigned to this teacher
      const { data: relationships, error: relError } = await supabase
        .from('teacher_student_relationships')
        .select('student_id')
        .eq('teacher_id', user?.id)
        .eq('is_active', true);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = relationships.map(rel => rel.student_id);

      // Get student info for these students
      const { data: studentInfo, error: studentError } = await supabase
        .from('student_info')
        .select('user_id, first_name, last_name, email')
        .in('user_id', studentIds);

      if (studentError) throw studentError;

      setStudents(studentInfo || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load your students.",
        variant: "destructive"
      });
      setStudents([]);
    }
  };

  const handleEdit = (appointment: StudentAppointment) => {
    setEditingAppointment(appointment);
    setEditFormData({
      appointmentType: appointment.appointment_type,
      scheduledAt: new Date(appointment.scheduled_at).toISOString().slice(0, 16),
      notes: appointment.notes || '',
      counselorName: appointment.counselor_name || '',
      status: appointment.status || 'scheduled'
    });
    setIsEditDialogOpen(true);
  };

  const handleConfirmAppointment = async (appointment: StudentAppointment) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment.id);

      if (error) throw error;

      toast({
        title: "Appointment Confirmed",
        description: `${appointment.student_name}'s appointment has been confirmed.`
      });

      // Reload to reflect the status change
      await loadStudentAppointments();
    } catch (error) {
      console.error('Confirm appointment error:', error);
      toast({
        title: "Error",
        description: "Failed to confirm appointment.",
        variant: "destructive"
      });
    }
  };

  const handleMarkCompleted = async (appointment: StudentAppointment) => {
    if (completingAppointment === appointment.id) return;
    
    setCompletingAppointment(appointment.id);
    
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (error) throw error;

      // Remove the appointment from local state immediately for better UX
      setAppointments(prev => prev.filter(apt => apt.id !== appointment.id));

      toast({
        title: "Appointment Completed",
        description: `${appointment.student_name}'s appointment has been marked as completed and removed.`
      });

      // Reload to ensure consistency
      await loadStudentAppointments();
    } catch (error) {
      console.error('Complete appointment error:', error);
      toast({
        title: "Error",
        description: "Failed to complete appointment.",
        variant: "destructive"
      });
    } finally {
      setCompletingAppointment(null);
    }
  };

  const handleUpdate = async () => {
    if (!editingAppointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_type: editFormData.appointmentType,
          scheduled_at: editFormData.scheduledAt,
          notes: editFormData.notes,
          counselor_name: editFormData.counselorName,
          status: editFormData.status
        })
        .eq('id', editingAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student appointment updated successfully."
      });

      setIsEditDialogOpen(false);
      setEditingAppointment(null);
      loadStudentAppointments();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment.",
        variant: "destructive"
      });
    }
  };

  const handleCreateAppointment = async () => {
    if (!newAppointmentData.studentId || !newAppointmentData.appointmentType || !newAppointmentData.scheduledAt) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setCreatingAppointment(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: newAppointmentData.studentId,
          appointment_type: newAppointmentData.appointmentType,
          scheduled_at: newAppointmentData.scheduledAt,
          notes: newAppointmentData.notes || null,
          counselor_name: newAppointmentData.counselorName || null,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment scheduled successfully."
      });

      setIsNewAppointmentDialogOpen(false);
      setNewAppointmentData({
        studentId: '',
        appointmentType: '',
        scheduledAt: '',
        notes: '',
        counselorName: ''
      });
      loadStudentAppointments();
    } catch (error) {
      console.error('Create appointment error:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment.",
        variant: "destructive"
      });
    } finally {
      setCreatingAppointment(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed': return 'bg-wellness-balance/20 text-primary';
      case 'pending': return 'bg-wellness-energy/20 text-accent-foreground';
      case 'completed': return 'bg-wellness-focus/20 text-wellness-focus';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Student Appointments
          </CardTitle>
          <CardDescription>Loading student appointments...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-background/50 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-muted"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Student Appointments
              </CardTitle>
              <CardDescription>
                {appointments.length > 0 
                  ? `Manage appointments for your ${appointments.length} student${appointments.length !== 1 ? 's' : ''}`
                  : "No student appointments found"
                }
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsNewAppointmentDialogOpen(true)}
              className="bg-primary hover:bg-primary-glow"
              disabled={students.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.length > 0 ? (
            <>
              {appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(appointment.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{appointment.appointment_type}</h4>
                        <p className="text-sm text-muted-foreground font-medium">{appointment.student_name}</p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status || 'scheduled'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {appointment.counselor_name || 'TBA'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(appointment.scheduled_at), 'MMM d, yyyy')} at {format(new Date(appointment.scheduled_at), 'h:mm a')}
                      </div>
                      {appointment.notes && (
                        <div className="flex items-start gap-2 mt-2">
                          <p className="text-sm"><strong>Notes:</strong> {appointment.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(appointment)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {appointment.status !== 'confirmed' && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleConfirmAppointment(appointment)}
                          className="flex-1 sm:flex-none"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm
                        </Button>
                      )}
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleMarkCompleted(appointment)}
                        disabled={completingAppointment === appointment.id}
                        className="flex-1 sm:flex-none bg-wellness-balance hover:bg-wellness-balance/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {completingAppointment === appointment.id ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No student appointments found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Your students haven't scheduled any appointments yet
              </p>
              {students.length > 0 && (
                <Button 
                  onClick={() => setIsNewAppointmentDialogOpen(true)}
                  className="bg-primary hover:bg-primary-glow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule First Appointment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Student Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details for {editingAppointment?.student_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentType">Session Type</Label>
              <Select value={editFormData.appointmentType} onValueChange={(value) => 
                setEditFormData(prev => ({ ...prev, appointmentType: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Choose session type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor">Preferred Counselor</Label>
              <Select value={editFormData.counselorName} onValueChange={(value) => 
                setEditFormData(prev => ({ ...prev, counselorName: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Any available counselor" />
                </SelectTrigger>
                <SelectContent>
                  {counselors.map((counselor) => (
                    <SelectItem key={counselor} value={counselor}>
                      {counselor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Appointment Status</Label>
              <Select value={editFormData.status} onValueChange={(value) => 
                setEditFormData(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date & Time</Label>
              <Input
                type="datetime-local"
                value={editFormData.scheduledAt}
                onChange={(e) => setEditFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any specific topics or special accommodations..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-primary hover:bg-primary-glow">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewAppointmentDialogOpen} onOpenChange={setIsNewAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment with one of your students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student">Select Student *</Label>
              <Select value={newAppointmentData.studentId} onValueChange={(value) => 
                setNewAppointmentData(prev => ({ ...prev, studentId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentType">Session Type *</Label>
              <Select value={newAppointmentData.appointmentType} onValueChange={(value) => 
                setNewAppointmentData(prev => ({ ...prev, appointmentType: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Choose session type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date & Time *</Label>
              <Input
                type="datetime-local"
                value={newAppointmentData.scheduledAt}
                onChange={(e) => setNewAppointmentData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor">Preferred Counselor</Label>
              <Select value={newAppointmentData.counselorName} onValueChange={(value) => 
                setNewAppointmentData(prev => ({ ...prev, counselorName: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Any available counselor" />
                </SelectTrigger>
                <SelectContent>
                  {counselors.map((counselor) => (
                    <SelectItem key={counselor} value={counselor}>
                      {counselor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any specific topics or special accommodations..."
                value={newAppointmentData.notes}
                onChange={(e) => setNewAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAppointmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment} 
              disabled={creatingAppointment}
              className="bg-primary hover:bg-primary-glow"
            >
              {creatingAppointment ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};