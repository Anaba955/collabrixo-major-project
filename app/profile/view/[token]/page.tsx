"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import JeemBackground from '../../../protected/_components/JeemBackground';
import PieChart from '../../../protected/_components/PieChart';
import Heatmap from '../../../protected/_components/Heatmap';
import { Badge } from "@/components/ui/badge";

// Import additional UI components for dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  public_url: string | null;
}

interface Skill {
  name: string;
  icon: string;
}

export default function PublicProfilePage({ params }: { params: { token: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [visualizationType, setVisualizationType] = useState<'heatmap' | 'piechart'>('heatmap');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { token } = params;

  // Function to get skill icons based on names
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

      // Other languages and tools
      "mongodb": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
      "mysql": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
      "postgresql": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
      "supabase": "https://seeklogo.com/images/S/supabase-logo-DCC676FFE2-seeklogo.com.png",
      "docker": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
      "kubernetes": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
      "git": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
      "figma": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
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

  // Fetch profile data using token
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        
        if (!token) {
          console.error('No token provided');
          return;
        }
        
        // Create a Supabase client without authentication
        const supabase = createClientComponentClient();
        
        // Get profile by token (which is now the public_url or a unique identifier)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('public_url', token)
          .single();
          
        if (profileError || !profileData) {
          // Try decoding the token as fallback (for backward compatibility)
          try {
            const decodedToken = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
            const userId = decodedToken.split('-')[0];
            
            if (userId) {
              const { data: userProfileData, error: userProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
              if (!userProfileError && userProfileData) {
                setProfile(userProfileData);
                processSkills(userProfileData);
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Error with fallback token decoding:', e);
          }
          
          console.error('Error fetching profile by public URL:', profileError);
          setIsLoading(false);
          return;
        }
        
        setProfile(profileData);
        processSkills(profileData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching shared profile:', error);
        setIsLoading(false);
      }
    };
    
    // Helper function to process skills
    const processSkills = (profileData: Profile) => {
      if (profileData.skills && Array.isArray(profileData.skills)) {
        const mappedSkills = profileData.skills.map((skill: string) => ({
          name: skill,
          icon: getSkillIcon(skill)
        }));
        
        setSkills(mappedSkills);
      }
    };
    
    fetchProfile();
  }, [token]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
        <p className="mb-6">The shared profile you're looking for doesn't exist or has been removed.</p>
        <a href="/" className="px-4 py-2 bg-black text-white rounded-md">Return Home</a>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 bg-transparent min-h-screen pb-24 max-w-[100vw] overflow-hidden">
      <JeemBackground opacity={0.7} blurAmount={120} speed={35} />
      
      {/* Profile Banner */}
      <div className="relative mb-20 sm:mb-24">
        <div className="w-full h-48 sm:h-64 md:h-72 rounded-xl overflow-hidden border-2 border-black dark:border-gray-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700">
            {profile?.banner_url && (
              <img 
                src={profile.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-16 sm:-bottom-20 left-6 sm:left-10">
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white dark:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-full h-full">
                <img 
                  src={profile?.avatar_url || "/dance.gif"} 
                  alt={profile?.username || "User"} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-black"></div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="absolute bottom-4 right-6 sm:right-10 text-right">
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
            {profile?.username || 'User'}
          </h1>
          <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
            @{profile?.username || profile?.email?.split('@')[0]}
          </p>
        </div>
      </div>
      
      {/* User Details and Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 mb-6">
        {/* User Details Card */}
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden lg:col-span-2">
          <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-blue-50/90 to-blue-100/90 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6">
            <CardTitle className="font-black text-base sm:text-lg">PROFILE DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
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
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Member Since</h3>
              <p className="mt-1">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}</p>
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
          </CardContent>
        </Card>
      </div>
      
      {/* Skills Section */}
      <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mb-6 overflow-hidden">
        <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-green-50/90 to-emerald-100/90 dark:from-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6">
          <CardTitle className="font-black text-base sm:text-lg">SKILLS & EXPERTISE</CardTitle>
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
                No skills added yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
        <p>Viewing shared profile page. <a href="/" className="underline">Return to home</a></p>
      </div>
    </div>
  );
} 