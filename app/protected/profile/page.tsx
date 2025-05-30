"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/utils/supabase/client';
import JeemBackground from '../_components/JeemBackground';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from '@supabase/supabase-js';
import PieChart from '../_components/PieChart';
import Heatmap from '../_components/Heatmap';

// Import additional UI components for dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';

// Interface that matches our actual database schema
interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  skills: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  bio: string | null;
  location: string | null;
  role: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  share_token?: string;
  public_url?: string;
}

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  projectsContributed: number;
  daysActive: number;
  avgCompletionTime: number;
}

interface Skill {
  name: string;
  icon: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [visualizationType, setVisualizationType] = useState<'heatmap' | 'piechart'>('heatmap');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs for file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    bio: "",
    location: "",
    role: "",
    username: "",
    newSkill: ""
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || "",
        location: profile.location || "",
        role: profile.role || "",
        username: profile.username || "",
        newSkill: ""
      });
    }
  }, [profile]);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not found');
        }
        
        setUser(user);
        
        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Create a new profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user.id,
                email: user.email,
                username: user.user_metadata?.username || user.email?.split('@')[0],
                skills: [],
                bio: null,
                location: null,
                role: null,
                avatar_url: null,
                banner_url: null
              }
            ])
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            setProfile(newProfile);
          }
        } else {
          setProfile(profileData);
          
          // Map skills to the format needed for the UI
          if (profileData.skills && Array.isArray(profileData.skills)) {
            const mappedSkills = profileData.skills.map((skill: string) => ({
              name: skill,
              icon: getSkillIcon(skill)
            }));
            
            setSkills(mappedSkills);
          }
        }
        
        // Fetch user stats
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('status, created_at, updated_at')
          .eq('assigned_to', user.id);
          
        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else {
          // Calculate stats
          const completedTasks = tasksData?.filter(task => task.status === 'done').length || 0;
          const inProgressTasks = tasksData?.filter(task => task.status === 'inProgress').length || 0;
          const totalTasks = tasksData?.length || 0;
          
          // Fetch projects user is contributing to
          const { data: projectsData } = await supabase
            .from('tasks')
            .select('project_id')
            .eq('assigned_to', user.id);
            
          // Get unique project IDs
          const uniqueProjects = new Set(projectsData?.map(task => task.project_id).filter(Boolean));
          
          // Calculate days active (days with activity in the last 30 days)
          const now = new Date();
          const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
          
          const activeDays = new Set();
          tasksData?.forEach(task => {
            const updatedDate = new Date(task.updated_at);
            if (updatedDate >= thirtyDaysAgo) {
              activeDays.add(updatedDate.toISOString().split('T')[0]);
            }
          });
          
          // Calculate average completion time in days (for completed tasks)
          let totalCompletionTime = 0;
          let completedTaskCount = 0;
          
          tasksData?.forEach(task => {
            if (task.status === 'done') {
              const createdDate = new Date(task.created_at);
              const updatedDate = new Date(task.updated_at);
              const completionTime = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
              totalCompletionTime += completionTime;
              completedTaskCount++;
            }
          });
          
          const avgCompletionTime = completedTaskCount > 0 
            ? Math.round(totalCompletionTime / completedTaskCount * 10) / 10 
            : 0;
          
          setUserStats({
            totalTasks,
            completedTasks,
            inProgressTasks,
            projectsContributed: uniqueProjects.size,
            daysActive: activeDays.size,
            avgCompletionTime
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Update the file upload function to try multiple buckets in sequence
  const handleFileUpload = async (file: File, fileType: 'avatar' | 'banner') => {
    try {
      // Convert the file to base64 for storage as a fallback option
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || !event.target.result) {
          alert('Failed to process image');
          return;
        }
        
        const base64 = event.target.result.toString();
        
        try {
          const supabase = createClient();
          
          // Check if storage buckets exist
          const { data: buckets } = await supabase.storage.listBuckets();
          console.log('Available storage buckets:', buckets);
          
          // Try multiple bucket names in sequence
          const bucketOptions = [
            fileType === 'avatar' ? 'avatars' : 'banners', // Try specific bucket first
            'storage', // Try default storage bucket
            'public',  // Try public bucket
          ];
          
          let uploaded = false;
          let fileUrl = '';
          
          // Try each bucket in sequence
          for (const bucketName of bucketOptions) {
            try {
              console.log(`Attempting upload to bucket: ${bucketName}`);
              
              // Create a unique filename
              const fileExt = file.name.split('.').pop();
              const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
              
              const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, { upsert: true });
                
              if (error) {
                console.log(`Upload to ${bucketName} failed:`, error);
                continue; // Try next bucket
              }
              
              // Successfully uploaded, get URL
              const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);
                
              fileUrl = urlData.publicUrl;
              uploaded = true;
              console.log(`${fileType} uploaded successfully to ${bucketName}, URL: ${fileUrl}`);
              break; // Exit loop since upload succeeded
            } catch (bucketError) {
              console.log(`Error trying bucket ${bucketName}:`, bucketError);
              // Continue to next bucket
            }
          }
          
          if (!uploaded) {
            console.log(`All bucket uploads failed, falling back to base64 storage for ${fileType}`);
            
            // Store in the profiles table directly as a fallback
            const updateField = fileType === 'avatar' ? 'avatar_url' : 'banner_url';
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ [updateField]: base64 })
              .eq('id', user?.id);
              
            if (updateError) {
              console.error('Error updating profile with base64 image:', updateError);
              alert(`Failed to save ${fileType}: ${updateError.message}`);
              return;
            }
            
            // Update state
            if (fileType === 'avatar') {
              setProfile(prev => prev ? { ...prev, avatar_url: base64 } : null);
            } else {
              setProfile(prev => prev ? { ...prev, banner_url: base64 } : null);
            }
            
            alert(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} saved directly to your profile (fallback method)`);
            return;
          }
          
          // Update profile with URL from successful storage upload
          const updateField = fileType === 'avatar' ? 'avatar_url' : 'banner_url';
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ [updateField]: fileUrl })
            .eq('id', user?.id);
            
          if (updateError) {
            console.error(`Error updating profile with ${fileType} URL:`, updateError);
            alert(`Failed to update profile with ${fileType} URL`);
            return;
          }
          
          // Update state
          if (fileType === 'avatar') {
            setProfile(prev => prev ? { ...prev, avatar_url: fileUrl } : null);
          } else {
            setProfile(prev => prev ? { ...prev, banner_url: fileUrl } : null);
          }
          
          alert(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} updated successfully!`);
        } catch (err) {
          console.error(`Error in ${fileType} upload process:`, err);
          alert(`Failed to upload ${fileType}: unexpected error`);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error processing image file');
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(`Error preparing ${fileType} upload:`, err);
      alert(`Failed to process ${fileType} image`);
    }
  };

  // Update the handleAvatarUpload function with more detailed logging
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      console.log("Avatar upload started");
      const file = e.target.files[0];
      console.log("Avatar file:", file.name, file.type, file.size);
      
      alert("Uploading profile picture...");
      
      // Try the direct base64 approach for avatars to ensure it works
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target || !event.target.result) {
            alert('Failed to process avatar image');
            return;
          }
          
          const base64 = event.target.result.toString();
          console.log("Successfully converted avatar to base64");
          
          const supabase = createClient();
          
          // Try to update the profile directly with base64
          console.log("Updating profile with base64 avatar");
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: base64 })
            .eq('id', user?.id);
            
          if (updateError) {
            console.error('Error updating profile with avatar:', updateError);
            alert(`Failed to update profile with avatar: ${updateError.message}`);
            return;
          }
          
          // Update state
          setProfile(prev => prev ? { ...prev, avatar_url: base64 } : null);
          console.log("Profile state updated with new avatar");
          alert("Profile picture updated successfully!");
        } catch (err) {
          console.error("Error in avatar upload process:", err);
          alert("Avatar upload failed. Please try again.");
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading avatar file');
        alert('Error processing avatar image file');
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error initiating avatar upload:", err);
      alert("Avatar upload failed. Please try again.");
    }
  };
  
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    alert("Uploading banner image...");
    await handleFileUpload(e.target.files[0], 'banner');
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save profile updates
  const saveProfile = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          location: formData.location,
          role: formData.role,
          username: formData.username
        })
        .eq('id', user?.id);
        
      if (error) throw error;
      
      setProfile(prev => prev ? { 
        ...prev, 
        bio: formData.bio,
        location: formData.location,
        role: formData.role,
        username: formData.username
      } : null);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Add a new skill
  const addSkill = async () => {
    if (!newSkill.trim()) return;
    
    try {
      const supabase = createClient();
      
      // Get current skills
      const currentSkills = profile?.skills || [];
      
      // Add new skill if it doesn't already exist
      if (!currentSkills.includes(newSkill)) {
        const updatedSkills = [...currentSkills, newSkill];
        
        const { error } = await supabase
          .from('profiles')
          .update({ skills: updatedSkills })
          .eq('id', user?.id);
          
        if (error) throw error;
        
        // Add skill to UI
        const newSkillObj = {
          name: newSkill,
          icon: getSkillIcon(newSkill)
        };
        
        setSkills(prev => [...prev, newSkillObj]);
        setProfile(prev => prev ? { ...prev, skills: updatedSkills } : null);
        setNewSkill("");
      }
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  // Calculate percentages safely
  const getPercentage = (completed: number = 0, total: number = 0): number => {
    if (total <= 0) return 0;
    return (completed / total) * 100;
  };

  // Add a function to get skill icons based on names
  const getSkillIcon = (skillName: string): string => {
    const skillIcons: Record<string, string> = {
      // Programming languages
      "javascript": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
      "typescript": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
      "python": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      "java": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
      "c#": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
      "c++": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
      "php": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
      "ruby": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
      "swift": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
      "kotlin": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
      "go": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
      "rust": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg",

      // Frontend frameworks/libraries
      "react": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      "angular": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
      "vue": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
      "svelte": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg",
      "next.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
      "jquery": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg",

      // CSS frameworks
      "tailwind": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg",
      "tailwindcss": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg",
      "bootstrap": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg",
      "sass": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg",
      "less": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/less/less-plain-wordmark.svg",

      // Backend frameworks
      "node.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
      "express": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
      "django": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg",
      "flask": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
      "spring": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg",
      "laravel": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg",
      "rails": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-plain.svg",

      // Databases
      "mongodb": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
      "mysql": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
      "postgresql": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
      "sqlite": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg",
      "redis": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
      "supabase": "https://seeklogo.com/images/S/supabase-logo-DCC676FFE2-seeklogo.com.png",

      // DevOps
      "docker": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
      "kubernetes": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
      "jenkins": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg",
      "git": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
      "github": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
      "gitlab": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg",

      // Cloud providers
      "aws": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
      "azure": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
      "gcp": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",
      "firebase": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",

      // Mobile
      "android": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg",
      "ios": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg",
      "flutter": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
      "react native": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",

      // Design tools
      "figma": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
      "photoshop": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg",
      "illustrator": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg",
      "xd": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-plain.svg",
      "sketch": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sketch/sketch-original.svg",

      // Testing
      "jest": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg",
      "mocha": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mocha/mocha-plain.svg",
      "cypress": "https://cdn.simpleicons.org/cypress/17202C",
      "selenium": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/selenium/selenium-original.svg",

      // Other
      "webpack": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg",
      "babel": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/babel/babel-original.svg",
      "nginx": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg",
      "apache": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apache/apache-original.svg",
      "linux": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
      "ubuntu": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg",
      "vscode": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg"
    };

    // Convert skill name to lowercase for case-insensitive matching
    const normalizedName = skillName.toLowerCase();
    
    // Return the matching icon or a default icon
    return skillIcons[normalizedName] || "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg";
  };

  // Add useEffect for dimensions
  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate appropriate sizes based on screen width
  const getChartWidth = () => {
    const width = dimensions.width;
    if (width < 640) return width - 40; // Mobile
    if (width < 768) return 500; // Small tablet
    if (width < 1024) return 600; // Tablet
    return 700; // Desktop
  };

  const getChartHeight = () => {
    return Math.min(getChartWidth() * 0.7, 350);
  };

  // Function to generate and share profile URL
  const shareProfile = async () => {
    try {
      if (!profile?.id) return;
      
      const supabase = createClient();
      
      // Generate a unique public URL token if one doesn't exist
      let publicUrlToken = profile.public_url;
      
      if (!publicUrlToken) {
        // Create a unique, hard-to-guess token
        publicUrlToken = crypto.randomUUID().replace(/-/g, '');
        
        // Save the token to the user's profile
        const { error } = await supabase
          .from('profiles')
          .update({ public_url: publicUrlToken })
          .eq('id', profile.id);
          
        if (error) {
          console.error('Error saving public URL token:', error);
          
          // Fallback: Use client-side token without saving to database
          publicUrlToken = btoa(`${profile.id}-${Date.now()}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        } else {
          // Update local state
          setProfile(prev => prev ? { ...prev, public_url: publicUrlToken } : null);
        }
      }
      
      // Create the shareable URL
      const url = `${window.location.origin}/profile/view/${publicUrlToken}`;
      setShareUrl(url);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
    } catch (error) {
      console.error('Error generating share URL:', error);
    }
  };

  // Function to copy URL to clipboard
  const copyUrlToClipboard = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 bg-transparent min-h-screen pb-24 max-w-[100vw] overflow-hidden">
      <JeemBackground opacity={0.7} blurAmount={120} speed={35} />
      
      {/* Profile Banner */}
      <div className="relative mb-20 sm:mb-24">
        <div 
          className="w-full h-48 sm:h-64 md:h-72 rounded-xl overflow-hidden border-2 border-black dark:border-gray-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative group cursor-pointer"
          onClick={() => bannerInputRef.current?.click()}
        >
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700">
            {profile?.banner_url && (
              <img 
                src={profile.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Add upload indicator for banner */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-md px-4 py-2 text-sm font-medium">
              Click to change banner
            </div>
          </div>
          <input 
            type="file" 
            ref={bannerInputRef} 
            onChange={handleBannerUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-16 sm:-bottom-20 left-6 sm:left-10">
          <div 
            className="relative group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white dark:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-full h-full">
                <img 
                  src={profile?.avatar_url || "/dance.gif"} 
                  alt={profile?.username || "User"} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Add upload indicator for profile picture */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-1 text-xs font-medium">
                Update
              </div>
            </div>
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={handleAvatarUpload} 
              className="hidden" 
              accept="image/*"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-black"></div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="absolute bottom-4 right-6 sm:right-10 text-right">
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
            {user?.user_metadata?.full_name || profile?.username || 'User'}
          </h1>
          <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
            @{profile?.username || user?.email?.split('@')[0]}
          </p>
        </div>
      </div>
      
      {/* User Details and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 mb-6">
        {/* User Details Card */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden lg:col-span-2">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-blue-50/90 to-blue-100/90 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <CardTitle className="font-black text-base sm:text-lg">PROFILE DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {isEditing ? (
              // Edit mode
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Username</h3>
                  <input 
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    placeholder="Your username"
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Bio</h3>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Location</h3>
                    <input 
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                      placeholder="Your location"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Role</h3>
                    <input 
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                      placeholder="Your role"
                    />
                  </div>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Username</h3>
                  <p className="mt-1">@{profile?.username || user?.email?.split('@')[0]}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Bio</h3>
                  <p className="mt-1">{profile?.bio || "No bio provided"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Location</h3>
                    <p className="mt-1">{profile?.location || "Not specified"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Role</h3>
                    <p className="mt-1">{profile?.role || "Team Member"}</p>
                  </div>
                </div>
              </>
            )}
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Email</h3>
              <p className="mt-1">{profile?.email || user?.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Member Since</h3>
              <p className="mt-1">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}</p>
            </div>
            
            <div className="pt-4">
              {isEditing ? (
                <div className="flex gap-3">
                  <button 
                    onClick={saveProfile}
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-4 rounded-md shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(128,128,128,1)] transition-all"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-white dark:bg-gray-800 text-black dark:text-white font-bold py-2 px-4 rounded-md border-2 border-black dark:border-gray-600 shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(128,128,128,1)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-4 rounded-md shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(128,128,128,1)] transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Visualization Card */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden lg:col-span-3">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-purple-50/90 to-indigo-100/90 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <CardTitle className="font-black text-base sm:text-lg">ACTIVITY VISUALIZATION</CardTitle>
              <div className="flex items-center gap-3">
                <Select
                  value={visualizationType}
                  onValueChange={(value: string) => setVisualizationType(value as 'heatmap' | 'piechart')}
                >
                  <SelectTrigger className="w-[140px] bg-white/90 dark:bg-gray-800 border-2 border-black dark:border-gray-700">
                    <SelectValue placeholder="Select chart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heatmap">Heatmap</SelectItem>
                    <SelectItem value="piechart">Pie Chart</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/90 dark:bg-gray-800 border-2 border-black dark:border-gray-700"
                  onClick={shareProfile}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            <div className="h-[350px] flex items-center justify-center">
              {dimensions.width > 0 && (
                <>
                  {visualizationType === 'heatmap' ? (
                    <Heatmap
                      width={getChartWidth()}
                      height={getChartHeight()}
                    />
                  ) : (
                    <PieChart
                      width={getChartWidth()}
                      height={getChartHeight()}
                    />
                  )}
                </>
              )}
              {dimensions.width === 0 && (
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              )}
            </div>
            {shareUrl && (
              <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-black/10 dark:border-white/10 flex items-center">
                <span className="truncate flex-1 text-sm">{shareUrl}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 flex-shrink-0"
                  onClick={copyUrlToClipboard}
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Skills Section */}
      <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mb-6 overflow-hidden">
        <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-green-50/90 to-emerald-100/90 dark:from-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <CardTitle className="font-black text-base sm:text-lg">SKILLS & EXPERTISE</CardTitle>
            {isEditing && (
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="px-2 py-1 text-xs rounded border border-black dark:border-green-600 bg-white/90 dark:bg-gray-800"
                />
                <span 
                  onClick={addSkill}
                  className="bg-green-200/90 dark:bg-green-800 text-green-800 dark:text-green-200 border border-black dark:border-green-600 px-2 py-1 text-xs rounded font-bold cursor-pointer"
                >
                  +Add Skill
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {skills.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {skills.map((skill, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-black/10 dark:border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 p-1 bg-white dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img 
                      src={skill.icon} 
                      alt={`${skill.name} icon`} 
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <span className="font-medium truncate">{skill.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-400 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">
                {isEditing 
                  ? "Add your first skill using the field above" 
                  : "No skills added yet. Click 'Edit Profile' to add skills."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
