import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, BookOpen, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface WellnessArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  url?: string;
  is_external: boolean;
  created_at: string;
  updated_at: string;
}

interface ArticleFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  url: string;
  is_external: boolean;
}

const categories = [
  "Mental Health",
  "Stress Management", 
  "Self Care",
  "Academic Support",
  "Mindfulness",
  "Anxiety",
  "Depression",
  "Sleep",
  "Nutrition",
  "Exercise"
];

export const WellnessArticleManagement = () => {
  const [articles, setArticles] = useState<WellnessArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<WellnessArticle | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    url: "",
    is_external: false
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "",
      url: "",
      is_external: false
    });
    setEditingArticle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast.error('Title and category are required');
      return;
    }

    if (formData.is_external && !formData.url) {
      toast.error('URL is required for external articles');
      return;
    }

    if (!formData.is_external && !formData.content) {
      toast.error('Content is required for internal articles');
      return;
    }

    try {
      const articleData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        content: formData.is_external ? null : formData.content,
        url: formData.is_external ? formData.url : null,
        is_external: formData.is_external
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('resources')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast.success('Article updated successfully');
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([articleData]);

        if (error) throw error;
        toast.success('Article created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    }
  };

  const handleEdit = (article: WellnessArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      description: article.description || "",
      content: article.content || "",
      category: article.category,
      url: article.url || "",
      is_external: article.is_external
    });
    setDialogOpen(true);
  };

  const handleDelete = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      
      toast.success('Article deleted successfully');
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wellness Articles</CardTitle>
          <CardDescription>Loading articles...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Wellness Articles
            </CardTitle>
            <CardDescription>
              Manage wellness resources and articles for students
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? 'Edit Article' : 'Create New Article'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Article title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the article"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Article Type</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={!formData.is_external ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, is_external: false, url: "" })}
                    >
                      Internal Article
                    </Button>
                    <Button
                      type="button"
                      variant={formData.is_external ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, is_external: true, content: "" })}
                    >
                      External Link
                    </Button>
                  </div>
                </div>

                {formData.is_external ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/article"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Article content (supports markdown)"
                      rows={8}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingArticle ? 'Update Article' : 'Create Article'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No wellness articles found. Create your first article to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{article.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                        {article.is_external && (
                          <Badge variant="outline" className="text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            External
                          </Badge>
                        )}
                      </div>
                      {article.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {article.description}
                        </p>
                      )}
                      {article.url && (
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {article.url}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Article</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{article.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(article.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};