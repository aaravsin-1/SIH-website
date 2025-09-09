import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'appointment' | 'mood_reminder' | 'wellness_tip' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const generateNotifications = async () => {
    if (!user) return;

    try {
      // Fetch notifications from database
      const { data: dbNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const formattedNotifications: Notification[] = (dbNotifications || []).map(notification => ({
        id: notification.id,
        type: notification.type as Notification['type'],
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.created_at),
        read: notification.read,
        priority: notification.priority as Notification['priority']
      }));

      // Generate additional notifications for immediate items
      const now = new Date();
      const additionalNotifications: Notification[] = [];

      // Check for upcoming appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true });

      appointments?.forEach(appointment => {
        const appointmentTime = new Date(appointment.scheduled_at);
        const hoursUntil = Math.round((appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        if (hoursUntil <= 24 && hoursUntil > 0) {
          additionalNotifications.push({
            id: `appointment-${appointment.id}`,
            type: 'appointment',
            title: 'Upcoming Appointment',
            message: `${appointment.appointment_type} with ${appointment.counselor_name} in ${hoursUntil} hours`,
            timestamp: now,
            read: false,
            priority: hoursUntil <= 2 ? 'high' : 'medium'
          });
        }
      });

      // Check for mood tracking reminders
      const { data: todayMood } = await supabase
        .from('mood_entries')
        .select('mood_value')
        .eq('user_id', user.id)
        .eq('date', now.toISOString().split('T')[0])
        .maybeSingle();

      if (!todayMood && now.getHours() >= 18) {
        additionalNotifications.push({
          id: 'mood-reminder-today',
          type: 'mood_reminder',
          title: 'Daily Mood Check-in',
          message: "Don't forget to log how you're feeling today",
          timestamp: now,
          read: false,
          priority: 'medium'
        });
      }

      // Combine database and generated notifications
      const allNotifications = [...formattedNotifications, ...additionalNotifications];
      
      // Remove duplicates based on ID
      const uniqueNotifications = allNotifications.filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id)
      );

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      generateNotifications();
      // Refresh notifications every 5 minutes
      const interval = setInterval(generateNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    // Update in database if it's a stored notification
    if (!notificationId.startsWith('appointment-') && !notificationId.startsWith('mood-reminder-')) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    }
    
    // Update in local state
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    // Update all stored notifications in database
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id);
    
    // Update in local state
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: generateNotifications
  };
};