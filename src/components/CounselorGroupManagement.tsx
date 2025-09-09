import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Users,
  Settings
} from 'lucide-react';

interface PeerGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  max_members: number;
  created_at: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  member_count?: number;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  student_phone: string;
}

interface CounselorGroupManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupsUpdated: () => void;
}

export const CounselorGroupManagement = ({ isOpen, onClose, onGroupsUpdated }: CounselorGroupManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<PeerGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PeerGroup | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [selectedGroupForPermissions, setSelectedGroupForPermissions] = useState<string | null>(null);
  const [groupPermissions, setGroupPermissions] = useState<{[studentId: string]: boolean}>({});

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    category: '',
    max_members: 20,
    is_default: false,
    is_active: true
  });

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load all groups (teachers can see all)
      const { data: groupsData, error: groupsError } = await supabase
        .from('peer_support_groups')
        .select(`
          *,
          group_members(count)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      const groupsWithMemberCount = groupsData?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithMemberCount);

      // Load teacher's students
      const { data: studentsData, error: studentsError } = await supabase
        .from('teacher_student_relationships')
        .select(`
          student_id,
          student_phone
        `)
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // Get student info for each student
      if (studentsData && studentsData.length > 0) {
        const studentIds = studentsData.map(rel => rel.student_id);
        
        const { data: studentInfoData, error: studentInfoError } = await supabase
          .from('student_info')
          .select('user_id, first_name, last_name')
          .in('user_id', studentIds);

        if (studentInfoError) throw studentInfoError;

        const studentsList = studentsData.map(rel => {
          const info = studentInfoData?.find(si => si.user_id === rel.student_id);
          return {
            student_id: rel.student_id,
            first_name: info?.first_name || '',
            last_name: info?.last_name || '',
            student_phone: rel.student_phone
          };
        });

        setStudents(studentsList);
      } else {
        setStudents([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load group management data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      description: '',
      category: '',
      max_members: 20,
      is_default: false,
      is_active: true
    });
    setIsGroupDialogOpen(true);
  };

  const handleEditGroup = (group: PeerGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description,
      category: group.category,
      max_members: group.max_members,
      is_default: group.is_default,
      is_active: group.is_active
    });
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!user) return;

    try {
      if (editingGroup) {
        // Update existing group
        const { error } = await supabase
          .from('peer_support_groups')
          .update({
            name: groupForm.name,
            description: groupForm.description,
            category: groupForm.category,
            max_members: groupForm.max_members,
            is_default: groupForm.is_default,
            is_active: groupForm.is_active
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        
        toast({
          title: "Group Updated",
          description: "Peer support group has been updated successfully."
        });
      } else {
        // Create new group
        const { error } = await supabase
          .from('peer_support_groups')
          .insert({
            name: groupForm.name,
            description: groupForm.description,
            category: groupForm.category,
            max_members: groupForm.max_members,
            is_default: groupForm.is_default,
            is_active: groupForm.is_active,
            created_by: user.id
          });

        if (error) throw error;
        
        toast({
          title: "Group Created",
          description: "New peer support group has been created successfully."
        });
      }

      setIsGroupDialogOpen(false);
      loadData();
      onGroupsUpdated();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save group. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('peer_support_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Group Deleted",
        description: "Peer support group has been deleted successfully."
      });

      loadData();
      onGroupsUpdated();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleGroupVisibility = async (groupId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('peer_support_groups')
        .update({ is_active: !isActive })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: isActive ? "Group Hidden" : "Group Visible",
        description: `Group is now ${isActive ? 'hidden from' : 'visible to'} students.`
      });

      loadData();
      onGroupsUpdated();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group visibility.",
        variant: "destructive"
      });
    }
  };

  const loadStudentPermissions = async (groupId: string) => {
    if (!user) return;

    try {
      const { data: permissions } = await supabase
        .from('student_group_permissions')
        .select('student_id')
        .eq('group_id', groupId)
        .eq('teacher_id', user.id);

      const permissionMap: {[key: string]: boolean} = {};
      students.forEach(student => {
        permissionMap[student.student_id] = permissions?.some(p => p.student_id === student.student_id) || false;
      });

      setGroupPermissions(permissionMap);
      setSelectedGroupForPermissions(groupId);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student permissions.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStudentPermission = async (studentId: string, groupId: string, hasPermission: boolean) => {
    if (!user) return;

    try {
      if (hasPermission) {
        // Remove permission
        const { error } = await supabase
          .from('student_group_permissions')
          .delete()
          .eq('student_id', studentId)
          .eq('group_id', groupId)
          .eq('teacher_id', user.id);

        if (error) throw error;
      } else {
        // Add permission
        const { error } = await supabase
          .from('student_group_permissions')
          .insert({
            student_id: studentId,
            group_id: groupId,
            teacher_id: user.id
          });

        if (error) throw error;
      }

      // Update local state
      setGroupPermissions(prev => ({
        ...prev,
        [studentId]: !hasPermission
      }));

      toast({
        title: hasPermission ? "Permission Removed" : "Permission Granted",
        description: `Student ${hasPermission ? 'can no longer' : 'can now'} see this group.`
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student permission.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Peer Group Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Peer Support Groups</h3>
            <Button onClick={handleCreateGroup} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Group
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{group.name}</h4>
                        {group.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        {!group.is_active && (
                          <Badge variant="destructive">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Category: {group.category}</span>
                        <span>Max Members: {group.max_members}</span>
                        <span>Current Members: {group.member_count}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadStudentPermissions(group.id)}
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleGroupVisibility(group.id, group.is_active)}
                      >
                        {group.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student Permissions Section */}
          {selectedGroupForPermissions && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Student Access Permissions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {students.map((student) => (
                  <div key={student.student_id} className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">
                      {student.first_name} {student.last_name}
                    </span>
                    <Switch
                      checked={groupPermissions[student.student_id] || false}
                      onCheckedChange={() => handleToggleStudentPermission(
                        student.student_id,
                        selectedGroupForPermissions,
                        groupPermissions[student.student_id] || false
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Group Create/Edit Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter group description"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={groupForm.category}
                  onValueChange={(value) => setGroupForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mental Health">Mental Health</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={groupForm.max_members}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, max_members: parseInt(e.target.value) || 20 }))}
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={groupForm.is_default}
                  onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="isDefault">Make this a default group (visible to all students)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={groupForm.is_active}
                  onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="isActive">Group is active and visible</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGroup}>
                {editingGroup ? 'Update Group' : 'Create Group'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};