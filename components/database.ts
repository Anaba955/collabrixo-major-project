// types/database.ts
export interface Project {
  project_id: string;
  name: string;
  team_members: string[]; // Array of user IDs
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  chat_type: 'team' | 'direct' | 'group';
  chat_id: string;
  sender_id: string;
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}



