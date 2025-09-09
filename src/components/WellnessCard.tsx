import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WellnessCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: "calm" | "energy" | "focus" | "balance";
  action: string;
  onClick?: () => void;
  whatsappNumber?: string;
  className?: string;
}

const gradientClasses = {
  calm: "bg-wellness-calm",
  energy: "bg-wellness-energy", 
  focus: "bg-wellness-focus",
  balance: "bg-wellness-balance"
};

export const WellnessCard = ({ 
  title, 
  description, 
  icon: Icon, 
  gradient, 
  action, 
  onClick,
  whatsappNumber,
  className 
}: WellnessCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (whatsappNumber) {
      // Clean the phone number and create WhatsApp URL
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}`;
      
      // Try to open WhatsApp - use location.href as fallback for better compatibility
      try {
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // Fallback if popup is blocked
          window.location.href = whatsappUrl;
        }
      } catch (error) {
        // Final fallback
        window.location.href = whatsappUrl;
      }
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className={cn(
        "wellness-card cursor-pointer group border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300",
          gradientClasses[gradient]
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          variant="ghost" 
          className="w-full justify-start p-0 h-auto text-primary hover:text-primary-glow font-medium pointer-events-none"
        >
          {action} →
        </Button>
      </CardContent>
    </Card>
  );
};