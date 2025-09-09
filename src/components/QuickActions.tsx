import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Users, BookOpen, Phone, HeartHandshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const quickActions = [
  {
    icon: MessageCircle,
    label: "Chat with AI Advisor",
    description: "Get instant, confidential support",
    color: "bg-primary/10 hover:bg-primary/20 text-primary",
    action: "chat-advisor"
  },
  {
    icon: Calendar,
    label: "Book Counseling",
    description: "Schedule with a professional",
    color: "bg-wellness-calm/30 hover:bg-wellness-calm/50 text-primary",
    action: "book-counseling"
  },
  {
    icon: Users,
    label: "Join Peer Support",
    description: "Connect with other students",
    color: "bg-wellness-balance/30 hover:bg-wellness-balance/50 text-primary",
    action: "peer-support"
  },
  {
    icon: BookOpen,
    label: "Wellness Resources",
    description: "Guides, articles, and tools",
    color: "bg-wellness-focus/30 hover:bg-wellness-focus/50 text-primary",
    action: "wellness-resources"
  },
  {
    icon: Phone,
    label: "Crisis Helpline",  
    description: "24/7 emergency support",
    color: "bg-accent/20 hover:bg-accent/30 text-accent-foreground",
    action: "crisis-helpline"
  },
  {
    icon: HeartHandshake,
    label: "Self-Care Activities",
    description: "Mindfulness and relaxation",
    color: "bg-wellness-energy/30 hover:bg-wellness-energy/50 text-primary",
    action: "self-care"
  }
];

export const QuickActions = () => {
  const { toast } = useToast();

  const handleActionClick = (action: string, label: string) => {
    switch (action) {
      case "chat-advisor":
        const whatsappUrl = "https://wa.me/919560102128";
        window.open(whatsappUrl, '_blank');
        break;
      case "book-counseling":
        window.location.href = '/book-counseling';
        break;
      case "peer-support":
        window.location.href = '/peer-support';
        break;
      case "wellness-resources":
        window.location.href = '/wellness-resources';
        break;
      case "self-care":
        window.location.href = '/self-care-activities';
        break;
      case "crisis-helpline":
        toast({
          title: "Crisis Support",
          description: "In emergency, call 911 or campus security: 555-0123"
        });
        break;
      default:
        toast({
          title: `${label}`,
          description: "This feature is coming soon! Stay tuned.",
        });
    }
  };
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-start gap-2 hover:scale-105 transition-all duration-200 ${action.color}`}
              onClick={() => handleActionClick(action.action, action.label)}
            >
              <action.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-sm leading-tight">{action.label}</div>
                <div className="text-xs opacity-75 leading-tight">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};