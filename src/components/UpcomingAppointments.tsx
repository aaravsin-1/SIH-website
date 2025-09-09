import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Video, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Appointment {
  id: string;
  appointment_type: string;
  counselor_name: string | null;
  scheduled_at: string;
  status: string | null;
  notes: string | null;
}

export const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(3);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
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
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>Loading your appointments...</CardDescription>
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
    <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Appointments
        </CardTitle>
        <CardDescription>
          {appointments.length > 0 
            ? "Stay connected with your support network" 
            : "No upcoming appointments scheduled"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.length > 0 ? (
          <>
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-foreground">{appointment.appointment_type}</h4>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status || 'scheduled'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {appointment.counselor_name || 'TBA'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format(new Date(appointment.scheduled_at), 'MMM d, yyyy')} at {format(new Date(appointment.scheduled_at), 'h:mm a')}
                    </div>
                    {appointment.notes && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {appointment.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <Link to="/appointments">
              <Button variant="outline" className="w-full mt-4">
                <Calendar className="w-4 h-4 mr-2" />
                View All Appointments
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No upcoming appointments</p>
            <Link to="/book-counseling">
              <Button className="bg-primary hover:bg-primary-glow">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};