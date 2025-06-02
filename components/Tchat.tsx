// // components/TeamChat.tsx
// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { Send, Users, MessageCircle } from 'lucide-react';
// import { Project, Message, User } from '@/components/database';

// interface TeamChatProps {
//   projectId: string;
//   currentUserId: string;
// }

// export default function TeamChat({ projectId, currentUserId }: TeamChatProps) {
//   const [messages, setMessages] = useState<(Message & { sender: User })[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [project, setProject] = useState<Project | null>(null);
//   const [teamMembers, setTeamMembers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const supabase = createClientComponentClient();

//   // Scroll to bottom of messages
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Fetch project and team members
//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         const { data: projectData, error: projectError } = await supabase
//           .from('projects')
//           .select('*')
//           .eq('id', projectId)
//           .single();

//         if (projectError) throw projectError;
//         setProject(projectData);

//         // Fetch team members
//         if (projectData.team_members && projectData.team_members.length > 0) {
//           const { data: usersData, error: usersError } = await supabase
//             .from('users')
//             .select('id, name, email, avatar_url')
//             .in('id', projectData.team_members);

//           if (usersError) throw usersError;
//           setTeamMembers(usersData || []);
//         }
//       } catch (error) {
//         console.error('Error fetching project:', error);
//       }
//     };

//     fetchProject();
//   }, [projectId, supabase]);

//   // Fetch messages
//   useEffect(() => {
//     const fetchMessages = async () => {
//       try {
//         const { data: messagesData, error } = await supabase
//           .from('messages')
//           .select(`
//             *,
//             sender:users!messages_sender_id_fkey(id, name, email, avatar_url)
//           `)
//           .eq('project_id', projectId)
//           .eq('chat_type', 'team')
//           .order('timestamp', { ascending: true });

//         if (error) throw error;
//         setMessages(messagesData || []);
//       } catch (error) {
//         console.error('Error fetching messages:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMessages();
//   }, [projectId, supabase]);

//   // Set up real-time subscription
//   useEffect(() => {
//     const channel = supabase
//       .channel(`team-chat-${projectId}`)
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'messages',
//           filter: `project_id=eq.${projectId}`,
//         },
//         async (payload) => {
//           // Fetch the new message with sender info
//           const { data: newMessageData, error } = await supabase
//             .from('messages')
//             .select(`
//               *,
//               sender:users!messages_sender_id_fkey(id, name, email, avatar_url)
//             `)
//             .eq('id', payload.new.id)
//             .single();

//           if (!error && newMessageData) {
//             setMessages((prev) => [...prev, newMessageData]);
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [projectId, supabase]);

//   // Send message
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     try {
//       const { error } = await supabase.from('messages').insert({
//         project_id: projectId,
//         chat_type: 'team',
//         chat_id: projectId, // Using project_id as chat_id for team chats
//         sender_id: currentUserId,
//         message: newMessage.trim(),
//         timestamp: new Date().toISOString(),
//       });

//       if (error) throw error;
//       setNewMessage('');
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   // Format timestamp
//   const formatTime = (timestamp: string) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

//     if (diffInHours < 24) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
//       {/* Chat Header */}
//       <div className="px-6 py-4 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <MessageCircle className="h-6 w-6 text-blue-600" />
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900">
//                 {project?.name} - Team Chat
//               </h3>
//               <p className="text-sm text-gray-500">
//                 {teamMembers.length} team members
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Users className="h-5 w-5 text-gray-400" />
//             <div className="flex -space-x-2">
//               {teamMembers.slice(0, 3).map((member) => (
//                 <div
//                   key={member.id}
//                   className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium border-2 border-white"
//                   title={member.name}
//                 >
//                   {member.name.charAt(0).toUpperCase()}
//                 </div>
//               ))}
//               {teamMembers.length > 3 && (
//                 <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
//                   +{teamMembers.length - 3}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Messages Area */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.length === 0 ? (
//           <div className="text-center py-8">
//             <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500">No messages yet. Start the conversation!</p>
//           </div>
//         ) : (
//           messages.map((message) => (
//             <div
//               key={message.id}
//               className={`flex ${
//                 message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
//               }`}
//             >
//               <div
//                 className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
//                   message.sender_id === currentUserId
//                     ? 'bg-blue-600 text-white'
//                     : 'bg-gray-100 text-gray-900'
//                 }`}
//               >
//                 {message.sender_id !== currentUserId && (
//                   <p className="text-xs font-semibold mb-1 text-gray-600">
//                     {message.sender?.name}
//                   </p>
//                 )}
//                 <p className="text-sm">{message.message}</p>
//                 <p
//                   className={`text-xs mt-1 ${
//                     message.sender_id === currentUserId
//                       ? 'text-blue-100'
//                       : 'text-gray-500'
//                   }`}
//                 >
//                   {formatTime(message.timestamp)}
//                 </p>
//               </div>
//             </div>
//           ))
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Message Input */}
//       <div className="px-4 py-4 border-t border-gray-200">
//         <form onSubmit={sendMessage} className="flex space-x-3">
//           <input
//             type="text"
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             placeholder="Type your message..."
//             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//           <button
//             type="submit"
//             disabled={!newMessage.trim()}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             <Send className="h-5 w-5" />
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }



// components/TeamChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

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
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // Fetch team members
        if (projectData.team_members && projectData.team_members.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, username, email, avatar_url')
            .in('id', projectData.team_members);

          if (usersError) throw usersError;
          setTeamMembers(usersData || []);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };
      
  fetchProject();
}, [projectId, supabase]);
      
   

  // Fetch messages
  useEffect(() => {
  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for projectId:', projectId);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name, email, avatar_url)
        `)
        .eq('project_id', projectId)
        .eq('chat_type', 'team')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Supabase error object:', error);
        throw new Error(error.message || 'Unknown Supabase fetch error');
      }

      console.log('Fetched messages:', messagesData);
      setMessages(messagesData || []);
    } catch (err) {
      console.error('Caught error in fetchMessages:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchMessages();
}, [projectId, supabase]);


  // Set up real-time subscription
  useEffect(() => {
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
          // Fetch the new message with sender info
          const { data: newMessageData, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && newMessageData) {
            setMessages((prev) => [...prev, newMessageData]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        project_id: projectId,
        chat_type: 'team',
        chat_id: projectId, // Using project_id as chat_id for team chats
        sender_id: currentUserId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                {project?.name} - Team Chat
              </h3>
              <p className="text-sm text-gray-500">
                {teamMembers.length} team members
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
                  title={member.username}
                >
                  {member.username.charAt(0).toUpperCase()}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                {message.sender_id !== currentUserId && (
                  <p className="text-xs font-semibold mb-1 text-gray-600">
                    {message.sender?.username}
                  </p>
                )}
                <p className="text-sm">{message.message}</p>
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
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}



