import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CounselorGroupManagement } from "@/components/CounselorGroupManagement";
import { Users, ArrowLeft, UserPlus, MessageCircle, Calendar, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface PeerGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  max_members: number;
  created_at: string;
  is_default: boolean;
  is_active: boolean;
  member_count?: number;
  is_member?: boolean;
}

export default function PeerSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<PeerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserRole();
      loadGroups();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;
    
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    setIsTeacher(!!teacherProfile);
  };

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      // Get groups with member counts - RLS will filter appropriately
      const { data: groupsData, error } = await supabase
        .from('peer_support_groups')
        .select(`
          *,
          group_members(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's memberships
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const memberGroupIds = memberships?.map(m => m.group_id) || [];

      const groupsWithStatus = groupsData?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0,
        is_member: memberGroupIds.includes(group.id)
      })) || [];

      setGroups(groupsWithStatus);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error",
        description: "Failed to load peer support groups.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Joined Group!",
        description: "Welcome to the peer support community."
      });

      loadGroups(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group. You might already be a member.",
        variant: "destructive"
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Left Group",
        description: "You've successfully left the group."
      });

      loadGroups(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to leave group. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'academic': return 'bg-wellness-focus/20 text-primary';
      case 'mental health': return 'bg-wellness-calm/20 text-primary';
      case 'social': return 'bg-wellness-balance/20 text-primary';
      case 'wellness': return 'bg-wellness-energy/20 text-primary';
      default: return 'bg-wellness-energy/20 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading peer support groups...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4">Peer Support Community</h1>
              <p className="text-muted-foreground text-lg">
                Connect with other students facing similar challenges. Share experiences, offer support, 
                and grow together in a safe, moderated environment.
              </p>
            </div>
            {isTeacher && (
              <Button 
                onClick={() => setIsManagementOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage Groups
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-2 flex items-center gap-2">
                      {group.name}
                      {group.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(group.category || '')}>
                        {group.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.member_count}/{group.max_members} members
                      </span>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {group.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {group.is_member ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => leaveGroup(group.id)}
                      >
                        Leave Group
                      </Button>
                      <Button className="flex-1 bg-primary hover:bg-primary-glow">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full bg-primary hover:bg-primary-glow"
                      onClick={() => joinGroup(group.id)}
                      disabled={group.member_count >= group.max_members}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {group.member_count >= group.max_members ? 'Group Full' : 'Join Group'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {groups.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg text-center p-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No groups available</h3>
            <p className="text-muted-foreground">
              {isTeacher 
                ? "Create new peer support groups to help your students connect and support each other."
                : "No peer support groups are currently available to you. Contact your counselor for access to groups."
              }
            </p>
          </Card>
        )}
      </div>

      <CounselorGroupManagement
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        onGroupsUpdated={loadGroups}
      />
    </div>
  );
}