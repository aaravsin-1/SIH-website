import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Send, 
  Reply, 
  Edit2, 
  Trash2, 
  X,
  MessageCircle,
  Users,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  message_type: string;
  reply_to: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  reply_message?: GroupMessage | null;
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupChat = ({ groupId, groupName, isOpen, onClose }: GroupChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages
  const loadMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get messages
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Then get user profiles for all unique users
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone')
        .in('user_id', userIds);

      // Combine messages with profile data
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        user_profile: profiles?.find(p => p.user_id === message.user_id) || null,
        reply_message: null // We'll fetch this separately if needed
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        group_id: groupId,
        user_id: user.id,
        message: newMessage.trim(),
        message_type: 'text',
        reply_to: replyTo?.id || null
      };

      const { data, error } = await supabase
        .from('group_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      // Add message immediately to local state for instant feedback
      if (data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();

        const messageWithProfile = {
          ...data,
          user_profile: profile,
          reply_message: null
        };

        setMessages(prev => [...prev, messageWithProfile]);
      }

      setNewMessage('');
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    if (!user || !newContent.trim()) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .update({ 
          message: newContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingMessage(null);
      setEditContent('');
      toast({
        title: "Success",
        description: "Message updated.",
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message.",
        variant: "destructive"
      });
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message deleted.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive"
      });
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!isOpen || !groupId) return;

    loadMessages();

    const channel = supabase
      .channel('group-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('New message from realtime:', payload);
          const newMessage = payload.new as GroupMessage;
          
          // Skip if this message is from the current user (already added locally)
          if (newMessage.user_id === user?.id) {
            console.log('Skipping own message from realtime');
            return;
          }
          
          // Get user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, phone')
            .eq('user_id', newMessage.user_id)
            .maybeSingle();

          const messageWithProfile = {
            ...newMessage,
            user_profile: profile,
            reply_message: null
          };

          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, messageWithProfile];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = payload.new as GroupMessage;
          
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { ...msg, ...updatedMessage }
              : msg
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Message deleted:', payload);
          const deletedMessage = payload.old as GroupMessage;
          
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, groupId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUserDisplayName = (msg: GroupMessage) => {
    const profile = msg.user_profile;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return msg.user_id.slice(0, 8);
  };

  const getInitials = (msg: GroupMessage) => {
    const profile = msg.user_profile;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`;
    }
    return '?';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {groupName}
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 p-4 border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.user_id === user?.id ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(message)}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 max-w-[70%] ${
                      message.user_id === user?.id ? 'text-right' : ''
                    }`}>
                      {/* Reply indicator */}
                      {message.reply_message && (
                        <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted/30 rounded border-l-2 border-primary">
                          <span className="font-medium">
                            Replying to {getUserDisplayName(message.reply_message)}:
                          </span>
                          <p className="truncate">{message.reply_message.message}</p>
                        </div>
                      )}

                      <div className={`rounded-lg p-3 ${
                        message.user_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        {editingMessage === message.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[60px] bg-background text-foreground border-border"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => editMessage(message.id, editContent)}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium mb-1">
                              {getUserDisplayName(message)}
                            </p>
                            <p className="whitespace-pre-wrap">{message.message}</p>
                            
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>
                                {format(new Date(message.created_at), 'MMM d, HH:mm')}
                                {message.edited_at && (
                                  <span className="ml-2">(edited)</span>
                                )}
                              </span>

                              {message.user_id === user?.id && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-white/20"
                                    onClick={() => {
                                      setEditingMessage(message.id);
                                      setEditContent(message.message);
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-destructive/20"
                                    onClick={() => deleteMessage(message.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Reply button for other users' messages */}
                      {message.user_id !== user?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 h-6 text-xs"
                          onClick={() => setReplyTo(message)}
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border-l-2 border-primary">
              <Reply className="w-4 h-4" />
              <span className="text-sm">
                Replying to <strong>{getUserDisplayName(replyTo)}</strong>: 
                <span className="ml-1 opacity-70">{replyTo.message}</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-6 w-6 p-0"
                onClick={() => setReplyTo(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2 mt-4">
            <Textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[60px] max-h-32"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};