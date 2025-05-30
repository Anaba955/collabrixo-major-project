import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Hash, Plus } from 'lucide-react';

// Mock Supabase client for demonstration
const createClient = () => ({
  from: (table) => ({
    select: (columns = '*') => ({
      contains: (column, value) => mockQuery(table, { contains: { [column]: value } }),
      in: (column, values) => mockQuery(table, { in: { [column]: values } }),
      eq: (column, value) => mockQuery(table, { eq: { [column]: value } }),
      is: (column, value) => mockQuery(table, { is: { [column]: value } }),
      order: (column, options) => mockQuery(table, { order: { [column]: options } })
    }),
    insert: (data) => ({
      select: () => mockInsert(table, data)
    })
  })
});

// TypeScript interfaces
interface Project {
  id: number;
  name: string;
  team_members: number[];
}

interface Profile {
  id: number;
  email: string;
}

interface GroupChat {
  id: number;
  project_id: number;
  name: string;
  members: number[];
  created_by: number;
}

interface Message {
  id: number;
  project_id: number;
  chat_type: 'project' | 'group';
  chat_id: number | null;
  sender_id: number;
  message: string;
  timestamp: string; // ISO string
}

interface MockData {
  projects: Project[];
  profiles: Profile[];
  groupchats: GroupChat[];
  messages: Message[];
}

// Mock data with proper typing
const mockData: MockData = {
  projects: [
    { id: 1, name: 'Project Alpha', team_members: [1, 2, 3] },
    { id: 2, name: 'Project Beta', team_members: [1, 4, 5] },
    { id: 3, name: 'Project Gamma', team_members: [1, 2, 4, 5] }
  ],
  profiles: [
    { id: 1, email: 'john.doe@company.com' },
    { id: 2, email: 'jane.smith@company.com' },
    { id: 3, email: 'bob.wilson@company.com' },
    { id: 4, email: 'alice.brown@company.com' },
    { id: 5, email: 'charlie.davis@company.com' },
    { id: 6, email: 'sarah.jones@company.com' }
  ],
  groupchats: [
    { id: 1, project_id: 1, name: 'Design Team', members: [1, 2, 3], created_by: 1 },
    { id: 2, project_id: 1, name: 'Frontend Dev', members: [1, 2], created_by: 2 },
    { id: 3, project_id: 2, name: 'Backend Team', members: [1, 4, 5], created_by: 4 },
    { id: 4, project_id: 3, name: 'QA Testing', members: [1, 2, 4], created_by: 1 }
  ],
  messages: [
    { id: 1, project_id: 1, chat_type: 'project', chat_id: null, sender_id: 2, message: 'Welcome to Project Alpha! Let\'s get started with the planning phase.', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 2, project_id: 1, chat_type: 'group', chat_id: 1, sender_id: 3, message: 'Design mockups are ready for review. Check the shared folder.', timestamp: new Date(Date.now() - 5400000).toISOString() },
    { id: 3, project_id: 1, chat_type: 'project', chat_id: null, sender_id: 1, message: 'Great work everyone! The client loved the initial designs.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 4, project_id: 1, chat_type: 'group', chat_id: 2, sender_id: 2, message: 'Frontend components are 80% complete. Need to work on responsive design.', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 5, project_id: 2, chat_type: 'project', chat_id: null, sender_id: 4, message: 'Project Beta kickoff meeting scheduled for tomorrow at 10 AM.', timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: 6, project_id: 2, chat_type: 'group', chat_id: 3, sender_id: 5, message: 'Database schema has been finalized. Starting implementation.', timestamp: new Date(Date.now() - 900000).toISOString() },
    { id: 7, project_id: 1, chat_type: 'group', chat_id: 1, sender_id: 1, message: 'The color palette looks perfect! Moving to development phase.', timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: 8, project_id: 3, chat_type: 'project', chat_id: null, sender_id: 2, message: 'Project Gamma requirements document is ready for review.', timestamp: new Date(Date.now() - 300000).toISOString() }
  ]
};

// Mock query function
const mockQuery = async (table, filters = {}) => {
  let data = [...mockData[table]];
  
  // Apply filters
  Object.entries(filters).forEach(([filterType, filterData]) => {
    if (filterType === 'contains') {
      Object.entries(filterData).forEach(([column, value]) => {
        data = data.filter(item => 
          Array.isArray(item[column]) && value.every(v => item[column].includes(v))
        );
      });
    } else if (filterType === 'in') {
      Object.entries(filterData).forEach(([column, values]) => {
        data = data.filter(item => values.includes(item[column]));
      });
    } else if (filterType === 'eq') {
      Object.entries(filterData).forEach(([column, value]) => {
        data = data.filter(item => item[column] === value);
      });
    } else if (filterType === 'is') {
      Object.entries(filterData).forEach(([column, value]) => {
        data = data.filter(item => item[column] === value);
      });
    } else if (filterType === 'order') {
      Object.entries(filterData).forEach(([column, options]) => {
        data.sort((a, b) => {
          if (options.ascending) {
            return new Date(a[column]) - new Date(b[column]);
          } else {
            return new Date(b[column]) - new Date(a[column]);
          }
        });
      });
    }
  });
  
  return { data, error: null };
};

// Mock insert function
const mockInsert = async (table, insertData) => {
  const newId = Math.max(...mockData[table].map(item => item.id), 0) + 1;
  const newItem = Array.isArray(insertData) ? 
    { ...insertData[0], id: newId } : 
    { ...insertData, id: newId };
  
  mockData[table].push(newItem);
  return { data: [newItem], error: null };
};

const TeamChat = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState({ type: 'project', id: null, name: 'General' });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const supabase = createClient();
  const currentUserId = 1; // Current logged-in user

  // Fetch projects where current user is a team member
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .contains('team_members', [currentUserId]);

        if (error) throw error;

        if (data && data.length > 0) {
          setProjects(data);
          setSelectedProject(data[0]);
          setActiveChat({ type: 'project', id: null, name: 'General' });
        } else {
          setError('No projects found for this user');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [currentUserId]);

  // Fetch team member profiles for selected project
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!selectedProject) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', selectedProject.team_members);

        if (error) throw error;
        
        if (data) {
          setProfiles(data);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    };
    
    fetchProfiles();
  }, [selectedProject]);

  // Fetch group chats for selected project
  useEffect(() => {
    const fetchGroupChats = async () => {
      if (!selectedProject) return;

      try {
        const { data, error } = await supabase
          .from('groupchats')
          .select('*')
          .eq('project_id', selectedProject.id)
          .contains('members', [currentUserId]);

        if (error) throw error;
        
        if (data) {
          setGroupChats(data);
        }
      } catch (err) {
        console.error('Error fetching group chats:', err);
      }
    };
    
    fetchGroupChats();
  }, [selectedProject]);

  // Fetch messages for active chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedProject) return;

      try {
        let query = supabase
          .from('messages')
          .select('*')
          .eq('project_id', selectedProject.id)
          .eq('chat_type', activeChat.type);

        // Filter by chat_id for group chats, or null for project general chat
        if (activeChat.type === 'group' && activeChat.id !== null) {
          query = query.eq('chat_id', activeChat.id);
        } else if (activeChat.type === 'project') {
          query = query.is('chat_id', null);
        }

        const { data, error } = await query.order('timestamp', { ascending: true });

        if (error) throw error;
        
        if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    
    fetchMessages();
  }, [selectedProject, activeChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const getProfile = (id) => {
    return profiles.find(p => p.id === id);
  };

  const getInitials = (email) => {
    if (!email) return '?';
    
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProject) return;

    const messagePayload = {
      project_id: selectedProject.id,
      chat_type: activeChat.type,
      chat_id: activeChat.type === 'project' ? null : activeChat.id,
      sender_id: currentUserId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([messagePayload])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setMessages(prev => [...prev, data[0]]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0 || !selectedProject) return;

    const groupPayload = {
      project_id: selectedProject.id,
      name: newGroupName.trim(),
      members: [currentUserId, ...selectedMembers],
      created_by: currentUserId,
    };

    try {
      const { data, error } = await supabase
        .from('groupchats')
        .insert([groupPayload])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setGroupChats(prev => [...prev, data[0]]);
        setNewGroupName('');
        setSelectedMembers([]);
        setShowCreateGroup(false);
        setActiveChat({ type: 'group', id: data[0].id, name: data[0].name });
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group');
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === Number(projectId));
    if (project) {
      setSelectedProject(project);
      setActiveChat({ type: 'project', id: null, name: 'General' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-gray-100 border-r flex flex-col">
        {/* Project Selection */}
        <div className="p-4 border-b">
          <select
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedProject?.id || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {/* General Project Chat */}
            <div
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                activeChat.type === 'project' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveChat({ type: 'project', id: null, name: 'General' })}
            >
              <Hash className="inline mr-2" size={16} />
              General
            </div>

            {/* Group Chats */}
            {groupChats.map(group => (
              <div
                key={group.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  activeChat.type === 'group' && activeChat.id === group.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => setActiveChat({ type: 'group', id: group.id, name: group.name })}
              >
                <Users className="inline mr-2" size={16} />
                {group.name}
              </div>
            ))}

            {/* Create Group Button */}
            <button
              className="w-full flex items-center p-3 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus size={16} className="mr-2" />
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">{activeChat.name}</h2>
            <div className="flex space-x-1">
              {profiles
                .filter(p => p.id !== currentUserId)
                .slice(0, 5) // Limit displayed avatars
                .map(profile => (
                  <div
                    key={profile.id}
                    className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium"
                    title={profile.email}
                  >
                    {getInitials(profile.email)}
                  </div>
                ))}
              {profiles.filter(p => p.id !== currentUserId).length > 5 && (
                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">
                  +{profiles.filter(p => p.id !== currentUserId).length - 5}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <Hash size={48} className="mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => {
                const senderProfile = getProfile(message.sender_id);
                const isCurrentUser = message.sender_id === currentUserId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <div className="mr-3 flex-shrink-0">
                        <div 
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium"
                          title={senderProfile?.email}
                        >
                          {getInitials(senderProfile?.email)}
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="break-words">{message.message}</div>
                      <div className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={1}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4">
            <h3 className="font-semibold text-lg mb-4">Create Group</h3>
            
            <div className="space-y-4">
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Members
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {profiles
                    .filter(profile => profile.id !== currentUserId)
                    .map(profile => (
                      <label key={profile.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(profile.id)}
                          onChange={() => toggleMember(profile.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{profile.email}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName('');
                  setSelectedMembers([]);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                disabled={!newGroupName.trim() || selectedMembers.length === 0}
                onClick={handleCreateGroup}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat;