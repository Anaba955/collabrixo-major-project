

// components/TeamChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client'; // Updated import
import { Send, Users, MessageCircle } from 'lucide-react';
import { Project, Message, User } from '@/components/database';

interface TeamChatProps {
  projectId: string;
  currentUserId: string;
}

export default function TeamChat({ projectId, currentUserId }: TeamChatProps) {
  const [messages, setMessages] = useState<(Message & { sender: User })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient(); // Updated client creation

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch project and team members
  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('🔍 Fetching project data for:', projectId);
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (projectError) {
          console.error('❌ Project fetch error:', projectError);
          throw new Error(`Failed to fetch project: ${projectError.message}`);
        }

        console.log('✅ Project data:', projectData);
        setProject(projectData);

        // Fetch team members if they exist
        if (projectData.team_members && Array.isArray(projectData.team_members) && projectData.team_members.length > 0) {
          console.log('🔍 Fetching team members:', projectData.team_members);
          
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, username, name, email, avatar_url')
            .in('id', projectData.team_members);

          if (usersError) {
            console.warn('⚠️ Team members fetch error:', usersError);
            // Don't throw here, just log the warning
          } else {
            console.log('✅ Team members data:', usersData);
            setTeamMembers(usersData || []);
          }
        } else {
          console.log('⚠️ No team members found or invalid team_members array');
          setTeamMembers([]);
        }
      } catch (error: any) {
        console.error('❌ Error in fetchProject:', error);
        setError(error.message || 'Failed to load project data');
      }
    };
      
    fetchProject();
  }, [projectId, supabase]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log('🔍 Fetching messages for projectId:', projectId);

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, username, email, avatar_url)
          `)
          .eq('project_id', projectId)
          .eq('chat_type', 'team')
          .order('timestamp', { ascending: true });

        if (messagesError) {
          console.error('❌ Messages fetch error:', messagesError);
          throw new Error(`Failed to fetch messages: ${messagesError.message}`);
        }

        console.log('✅ Fetched messages:', messagesData);
        setMessages(messagesData || []);
      } catch (err: any) {
        console.error('❌ Error in fetchMessages:', err);
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [projectId, supabase]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔍 Setting up real-time subscription for project:', projectId);
    
    const channel = supabase
      .channel(`team-chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log('🔔 New message received:', payload);
          
          try {
            // Fetch the new message with sender info
            const { data: newMessageData, error } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, username, name, email, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('❌ Error fetching new message:', error);
            } else if (newMessageData) {
              console.log('✅ Adding new message to state:', newMessageData);
              setMessages((prev) => [...prev, newMessageData]);
            }
          } catch (err) {
            console.error('❌ Error in real-time message handler:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('📤 Sending message:', messageText);
      
      const { error } = await supabase.from('messages').insert({
        project_id: projectId,
        chat_type: 'team',
        chat_id: projectId, // Using project_id as chat_id for team chats
        sender_id: currentUserId,
        message: messageText,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error('❌ Send message error:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }

      console.log('✅ Message sent successfully');
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      setError(error.message || 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (err) {
      console.error('❌ Error formatting time:', err);
      return 'Invalid time';
    }
  };

  // Get display name for user
  const getDisplayName = (user: User) => {
    return user.username  || user.email?.split('@')[0] || 'Unknown User';
  };

  // Get user initials for avatar
  const getUserInitials = (user: User) => {
    const displayName = getDisplayName(user);
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-semibold">Chat Error</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {project?.name || 'Team Chat'}
              </h3>
              <p className="text-sm text-gray-500">
                {project?.team_members?.length ?? 0} team member{project?.team_members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium border-2 border-white"
                  title={getDisplayName(member)}
                >
                  {getUserInitials(member)}
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.sender_id !== currentUserId && message.sender && (
                  <p className="text-xs font-semibold mb-1 text-gray-600">
                    {getDisplayName(message.sender)}
                  </p>
                )}
                <p className="text-sm break-words">{message.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender_id === currentUserId
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}