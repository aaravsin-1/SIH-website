import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, ArrowLeft, Clock, User, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_type: string;
  counselor_name: string | null;
  scheduled_at: string;
  status: string | null;
  notes: string | null;
}

interface EditFormData {
  appointmentType: string;
  scheduledAt: string;
  notes: string;
  counselorName: string;
}

export default function AppointmentsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    appointmentType: '',
    scheduledAt: '',
    notes: '',
    counselorName: ''
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditFormData({
      appointmentType: appointment.appointment_type,
      scheduledAt: new Date(appointment.scheduled_at).toISOString().slice(0, 16),
      notes: appointment.notes || '',
      counselorName: appointment.counselor_name || ''
    });
    setIsEditDialogOpen(true);
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
          counselor_name: editFormData.counselorName
        })
        .eq('id', editingAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment updated successfully."
      });

      setIsEditDialogOpen(false);
      setEditingAppointment(null);
      loadAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!user?.id) {
      console.error('No user ID available');
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return;
    }

    console.log('Deleting appointment:', appointmentId, 'for user:', user.id);
    
    try {
      // Check if the specific appointment exists and belongs to user
      const { data: existing, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single();

      console.log('Target appointment:', existing, 'Error:', fetchError);

      if (fetchError || !existing) {
        console.error('Appointment not found or not owned by user:', fetchError);
        toast({
          title: "Error", 
          description: "Appointment not found or you don't have permission to delete it.",
          variant: "destructive"
        });
        return;
      }

      // Delete the appointment with both ID and user_id for security
      const { error: deleteError, count } = await supabase
        .from('appointments')
        .delete({ count: 'exact' })
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      console.log('Delete attempt result:', { deleteError, count });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        toast({
          title: "Error",
          description: `Delete failed: ${deleteError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (count === 0) {
        console.error('No rows deleted - possible RLS policy issue');
        toast({
          title: "Error",
          description: "Appointment could not be deleted. This may be due to database permissions.",
          variant: "destructive"
        });
        return;
      }

      // Update local state immediately
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      
      toast({
        title: "Success",
        description: "Appointment deleted successfully."
      });

      // Reload to ensure consistency
      await loadAppointments();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete appointment.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed': return 'bg-wellness-balance/20 text-primary';
      case 'pending': return 'bg-wellness-energy/20 text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-glow mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Loading appointments...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-glow mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              My Appointments
            </CardTitle>
            <CardDescription>
              Manage your counseling appointments - view, edit, or cancel upcoming sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
              </p>
              <Link to="/book-counseling">
                <Button className="bg-primary hover:bg-primary-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Book New Appointment
                </Button>
              </Link>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex items-start gap-4 p-6 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="font-semibold text-lg text-foreground">{appointment.appointment_type}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status || 'scheduled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {appointment.counselor_name || 'TBA'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {format(new Date(appointment.scheduled_at), 'EEEE, MMM d, yyyy')} at {format(new Date(appointment.scheduled_at), 'h:mm a')}
                        </div>
                        {appointment.notes && (
                          <div className="mt-2">
                            <p className="text-sm"><strong>Notes:</strong> {appointment.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this appointment with {appointment.counselor_name || 'TBA'} on {format(new Date(appointment.scheduled_at), 'MMM d, yyyy')}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Confirm delete click for', appointment.id);
                                  await handleDelete(appointment.id);
                                }}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete Appointment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No appointments found</p>
                <Link to="/book-counseling">
                  <Button className="bg-primary hover:bg-primary-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
              <DialogDescription>
                Make changes to your appointment details below.
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
      </div>
    </div>
  );
}