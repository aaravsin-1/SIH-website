import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HeartHandshake, ArrowLeft, Clock, Play, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  instructions: string;
  difficulty_level: string;
  completed?: boolean;
}

interface ActivityCompletion {
  activity_id: string;
  mood_after: number;
  notes: string;
  actual_duration: number;
}

export default function SelfCareActivities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completionData, setCompletionData] = useState<ActivityCompletion>({
    activity_id: '',
    mood_after: 3,
    notes: '',
    actual_duration: 0
  });

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;
    
    try {
      // Get all activities
      const { data: activitiesData, error } = await supabase
        .from('self_care_activities')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      // Get user's completed activities for today
      const today = new Date().toISOString().split('T')[0];
      const { data: completions } = await supabase
        .from('activity_completions')
        .select('activity_id')
        .eq('user_id', user.id)
        .gte('completed_at', today + 'T00:00:00')
        .lt('completed_at', today + 'T23:59:59');

      const completedIds = completions?.map(c => c.activity_id) || [];

      const activitiesWithStatus = activitiesData?.map(activity => ({
        ...activity,
        completed: completedIds.includes(activity.id)
      })) || [];

      setActivities(activitiesWithStatus);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeActivity = async (activityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_completions')
        .insert({
          user_id: user.id,
          activity_id: activityId,
          mood_after: completionData.mood_after,
          notes: completionData.notes,
          actual_duration_minutes: completionData.actual_duration
        });

      if (error) throw error;

      toast({
        title: "Activity Completed!",
        description: "Great job taking care of yourself today."
      });

      // Reset completion data
      setCompletionData({
        activity_id: '',
        mood_after: 3,
        notes: '',
        actual_duration: 0
      });

      loadActivities(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record activity completion.",
        variant: "destructive"
      });
    }
  };

  const categories = [
    { value: 'all', label: 'All Activities' },
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'physical', label: 'Physical' },
    { value: 'relaxation', label: 'Relaxation' },
    { value: 'journaling', label: 'Journaling' }
  ];

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mindfulness': return 'bg-wellness-calm/20 text-primary';
      case 'physical': return 'bg-wellness-energy/20 text-primary';
      case 'relaxation': return 'bg-wellness-balance/20 text-primary';
      case 'journaling': return 'bg-wellness-focus/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading self-care activities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-glow mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <HeartHandshake className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Self-Care Activities
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Take time for yourself with guided activities designed to boost your well-being and mental health.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className={`transition-all duration-200 ${
                selectedCategory === category.value 
                  ? "bg-primary hover:bg-primary-glow shadow-lg scale-105" 
                  : "hover:scale-105 hover:shadow-md"
              }`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className={`group bg-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${activity.completed ? 'ring-2 ring-green-500/20' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`${getCategoryColor(activity.category)} font-medium`}>
                    {activity.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getDifficultyColor(activity.difficulty_level)} text-xs`}>
                      {activity.difficulty_level}
                    </Badge>
                    {activity.completed && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Done</span>
                      </div>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {activity.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {activity.description}
                </CardDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 p-2 bg-muted/50 rounded-lg">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{activity.duration_minutes} minutes</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="p-3 bg-accent/20 rounded-lg border-l-4 border-primary">
                    <h4 className="font-semibold text-sm text-primary mb-1">Instructions:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{activity.instructions}</p>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className={`w-full transition-all duration-200 ${
                          activity.completed 
                            ? "bg-green-600 hover:bg-green-700 cursor-not-allowed" 
                            : "bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl"
                        }`}
                        disabled={activity.completed}
                        onClick={() => {
                          setCompletionData(prev => ({ 
                            ...prev, 
                            activity_id: activity.id,
                            actual_duration: activity.duration_minutes || 0
                          }));
                        }}
                      >
                        {activity.completed ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Completed Today
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Start Activity
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Complete Activity</DialogTitle>
                        <DialogDescription className="text-base">
                          How did this activity make you feel? Your feedback helps us provide better recommendations.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-base font-medium">How much time did you spend on this activity?</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="300"
                              value={completionData.actual_duration}
                              onChange={(e) => setCompletionData(prev => ({
                                ...prev,
                                actual_duration: parseInt(e.target.value) || 0
                              }))}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">minutes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Suggested: {activities.find(a => a.id === completionData.activity_id)?.duration_minutes || 0} minutes
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">How do you feel after completing this activity?</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((mood) => (
                              <Button
                                key={mood}
                                variant={completionData.mood_after === mood ? "default" : "outline"}
                                size="sm"
                                className={`flex-1 ${
                                  completionData.mood_after === mood 
                                    ? "bg-primary hover:bg-primary-glow" 
                                    : "hover:bg-accent"
                                }`}
                                onClick={() => setCompletionData(prev => ({ ...prev, mood_after: mood }))}
                              >
                                {mood === 1 && "😔"}
                                {mood === 2 && "😕"}
                                {mood === 3 && "😐"}
                                {mood === 4 && "🙂"}
                                {mood === 5 && "😊"}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            1 = Not great • 5 = Excellent
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Notes (optional)</Label>
                          <Textarea
                            placeholder="How did this activity help you? Any thoughts or reflections..."
                            value={completionData.notes}
                            onChange={(e) => setCompletionData(prev => ({
                              ...prev,
                              notes: e.target.value
                            }))}
                            className="min-h-[80px]"
                          />
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => completeActivity(activity.id)}
                        >
                          Complete Activity
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg text-center p-12">
            <HeartHandshake className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No activities found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'Check back soon for new self-care activities.'
                : `No activities found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}