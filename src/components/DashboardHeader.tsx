import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Settings, Menu, LogOut, Calendar, Heart, AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { UserSettingsDialog } from "./UserSettingsDialog";
import { ThemeToggle } from "./ThemeToggle";
interface DashboardHeaderProps {
  userName?: string;
  notifications?: number;
  isTeacher?: boolean;
}
export const DashboardHeader = ({
  userName = "Student",
  notifications = 2,
  isTeacher = false
}: DashboardHeaderProps) => {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const {
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const {
    notifications: notificationList,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'mood_reminder':
        return <Heart className="w-4 h-4 text-accent" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'wellness_tip':
        return <Lightbulb className="w-4 h-4 text-wellness-energy" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-destructive bg-destructive/5';
      case 'medium':
        return 'border-l-accent bg-accent/5';
      case 'low':
        return 'border-l-primary bg-primary/5';
      default:
        return 'border-l-muted';
    }
  };
  return <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Manas Stithi</h1>
            <p className="text-sm text-muted-foreground">Your wellness journey starts here</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-foreground">
                      Mark all read
                    </Button>}
                </div>
              </div>
              <ScrollArea className="h-96">
                {notificationList.length === 0 ? <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs">We'll notify you about appointments, mood reminders, and wellness tips</p>
                  </div> : <div className="p-2">
                    {notificationList.map(notification => <div key={notification.id} className={`p-3 mb-2 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-muted/50 ${notification.read ? 'opacity-60' : ''} ${getPriorityColor(notification.priority)}`} onClick={() => markAsRead(notification.id)}>
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-sm leading-tight">
                                {notification.title}
                              </h5>
                              {!notification.read && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1"></div>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true
                        })}
                            </p>
                          </div>
                        </div>
                      </div>)}
                  </div>}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          
          <ThemeToggle />
          
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">Welcome back,</p>
              <p className="text-sm text-muted-foreground">{userName}</p>
            </div>
          </div>
        </div>
      </div>
      
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>;
};