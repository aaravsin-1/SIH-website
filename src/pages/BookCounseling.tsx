import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function BookCounseling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    appointmentType: '',
    scheduledAt: '',
    notes: '',
    counselorName: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          appointment_type: formData.appointmentType,
          scheduled_at: formData.scheduledAt,
          notes: formData.notes,
          counselor_name: formData.counselorName,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Appointment Requested",
        description: "Your counseling appointment has been requested. You'll receive confirmation within 24 hours."
      });

      // Reset form
      setFormData({
        appointmentType: '',
        scheduledAt: '',
        notes: '',
        counselorName: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-glow mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Book Counseling Session
            </CardTitle>
            <CardDescription>
              Schedule a confidential session with one of our professional counselors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Session Type *</Label>
                <Select value={formData.appointmentType} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, appointmentType: value }))
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
                <Select value={formData.counselorName} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, counselorName: value }))
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
                <Label htmlFor="scheduledAt">Preferred Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific topics you'd like to discuss or special accommodations needed..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  What to Expect
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sessions are typically 50 minutes long</li>
                  <li>• All conversations are completely confidential</li>
                  <li>• You'll receive confirmation within 24 hours</li>
                  <li>• You can reschedule up to 24 hours in advance</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-glow"
                disabled={loading || !formData.appointmentType || !formData.scheduledAt}
              >
                {loading ? 'Booking...' : 'Request Appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}