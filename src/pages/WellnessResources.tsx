import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  url?: string;
  is_external: boolean;
  created_at: string;
}

export default function WellnessResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'academic', label: 'Academic Support' },
    { value: 'support', label: 'Support Services' },
    { value: 'health', label: 'Mental Health' }
  ];

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(resource => resource.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mindfulness': return 'bg-wellness-calm/20 text-primary';
      case 'academic': return 'bg-wellness-focus/20 text-primary';
      case 'support': return 'bg-wellness-balance/20 text-primary';
      case 'health': return 'bg-wellness-energy/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading resources...</p>
          </div>
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Wellness Resources
          </h1>
          <p className="text-muted-foreground text-lg">
            Access guides, articles, and tools to support your mental health and academic success.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value ? "bg-primary hover:bg-primary-glow" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getCategoryColor(resource.category)}>
                    {resource.category}
                  </Badge>
                  {resource.is_external && (
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-lg font-semibold">
                  {resource.title}
                </CardTitle>
                <CardDescription>
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {resource.content}
                  </div>
                  
                  {resource.url ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Resource
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Read Full Article
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg text-center p-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'Check back soon for new wellness resources.'
                : `No resources found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}