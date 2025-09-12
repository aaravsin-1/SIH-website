import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const moods = [
  { emoji: "😢", label: "Very Low", value: 1, color: "bg-destructive/10 hover:bg-destructive/20" },
  { emoji: "😔", label: "Low", value: 2, color: "bg-accent/10 hover:bg-accent/20" },
  { emoji: "😐", label: "Okay", value: 3, color: "bg-muted hover:bg-muted/80" },
  { emoji: "🙂", label: "Good", value: 4, color: "bg-wellness-balance/20 hover:bg-wellness-balance/30" },
  { emoji: "😊", label: "Great", value: 5, color: "bg-primary/10 hover:bg-primary/20" },
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todaysMood, setTodaysMood] = useState<number | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTodaysMood();
    }
  }, [user]);

  const loadTodaysMood = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('mood_entries')
      .select('mood_value')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
    
    if (data) {
      setTodaysMood(data.mood_value);
      setSelectedMood(data.mood_value);
    }
  };

  const handleMoodSelect = (value: number) => {
    setSelectedMood(value);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !user) return;
    
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { error } = await supabase
        .from('mood_entries')
        .upsert({
          user_id: user.id,
          mood_value: selectedMood,
          date: today
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      setTodaysMood(selectedMood);
      setIsSubmitted(true);
      toast({
        title: "Mood tracked!",
        description: "Your daily mood has been recorded."
      });
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save mood. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">How are you feeling today?</CardTitle>
        <CardDescription>
          Track your mood to help us provide personalized support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubmitted ? (
          <>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl transition-all duration-200 border-2",
                    selectedMood === mood.value 
                      ? "border-primary bg-primary/10 scale-105" 
                      : "border-transparent hover:scale-105",
                    mood.color
                  )}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-xs font-medium text-foreground/80">{mood.label}</span>
                </button>
              ))}
            </div>
            {selectedMood && (
              <Button 
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-primary-glow text-primary-foreground"
                disabled={loading}
              >
                {loading ? 'Saving...' : (todaysMood ? 'Update Mood' : 'Track Mood')}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-primary font-medium">Mood tracked! Keep taking care of yourself.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};