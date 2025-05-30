"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, GitCommit, AlertCircle, Search, ExternalLink, Calendar, User, Save, Edit, Check } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { useParams, usePathname } from 'next/navigation';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    }
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  created_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
}

interface GitHubRepository {
  id: string;
  project_id: string;
  repository_url: string;
}

export default function GithubActivity() {
  // Get project ID from URL using multiple approaches
  const params = useParams();
  const pathname = usePathname();
  
  // Try to get project ID from different possible parameter names
  const getProjectId = () => {
    console.log('All URL params:', params);
    
    // Try direct 'id' param
    if (typeof params?.id === 'string' && params.id) {
      console.log('Found project ID in params.id:', params.id);
      return params.id;
    }
    
    // Try 'projectId' param
    if (typeof params?.projectId === 'string' && params.projectId) {
      console.log('Found project ID in params.projectId:', params.projectId);
      return params.projectId;
    }
    
    // If params are an array (catch-all route)
    if (Array.isArray(params?.slug)) {
      const possibleId = params.slug[params.slug.length - 1];
      if (possibleId) {
        console.log('Found project ID in slug array:', possibleId);
        return possibleId;
      }
    }
    
    // Last resort: try to extract from pathname
    if (pathname) {
      console.log('Current pathname:', pathname);
      const pathParts = pathname.split('/').filter(Boolean);
      // Get the last segment that looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (uuidRegex.test(pathParts[i])) {
          console.log('Found project ID in pathname:', pathParts[i]);
          return pathParts[i];
        }
      }
      
      // If we can't find a UUID pattern, just try the last segment
      const lastSegment = pathParts[pathParts.length - 1];
      console.log('Using last path segment as project ID:', lastSegment);
      return lastSegment;
    }
    
    console.error('Could not determine project ID from URL');
    return '';
  };

  const projectId = getProjectId();
  
  useEffect(() => {
    console.log('Final project ID being used:', projectId);
  }, [projectId]);

  const [repoUrl, setRepoUrl] = useState('');
  const [savedRepoUrl, setSavedRepoUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Fetch project GitHub repository on component mount
  useEffect(() => {
    if (projectId) {
      fetchProjectRepository();
      fetchProjectName();
    }
  }, [projectId]);

  // Fetch project name
  const fetchProjectName = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .eq('project_id', projectId)
        .single();

      if (!error && data) {
        setProjectName(data.name);
      }
    } catch (error) {
      console.error('Error fetching project name:', error);
    }
  };

  // Fetch GitHub repository for this project
  const fetchProjectRepository = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('github_repositories')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (!error && data) {
        setRepoUrl(data.repository_url);
        setSavedRepoUrl(data.repository_url);
        parseGitHubUrl(data.repository_url);
        
        // Automatically fetch GitHub data if we have a valid URL
        if (data.repository_url) {
          await fetchGitHubDataForUrl(data.repository_url);
        }
      }
    } catch (error) {
      console.error('Error fetching project repository:', error);
    }
  };

  // Save GitHub repository URL for this project
  const saveRepositoryUrl = async () => {
    if (!projectId || !repoUrl) {
      console.error('Missing data for save:', { projectId, repoUrl });
      setError(`Missing ${!projectId ? 'project ID' : 'repository URL'}`);
      return;
    }

    setSaving(true);
    setError('');
    console.log('Attempting to save repository URL:', { projectId, repoUrl });
    
    try {
      const supabase = createClient();
      
      // First, log all parameters being used
      console.log('Save parameters:', {
        id: crypto.randomUUID(),
        project_id: projectId,
        repository_url: repoUrl,
        timestamp: new Date().toISOString()
      });
      
      // Direct insert approach
      const { data: insertData, error: insertError } = await supabase
        .from('github_repositories')
        .upsert({
          id: crypto.randomUUID(), // Generate a new UUID
          project_id: projectId,
          repository_url: repoUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'project_id' 
        });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to save repository URL: ${insertError.message}`);
      }
      
      console.log('Repository URL saved successfully:', insertData);
      setSavedRepoUrl(repoUrl);
      setIsEditing(false);
      
      // Refresh data
      fetchProjectRepository();
      
    } catch (err: any) {
      console.error('Error saving repository URL:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Parse GitHub URL to extract owner and repo
  const parseGitHubUrl = (url: string) => {
    // If URL is empty, don't show an error
    if (!url.trim()) {
      setOwner('');
      setRepo('');
      setError(''); // Clear any existing error
      return false;
    }
    
    try {
      // Try to parse the GitHub URL
      const urlObj = new URL(url);
      if (urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com') {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          setOwner(pathParts[0]);
          setRepo(pathParts[1]);
          setError(''); // Clear any existing error
          return true;
        }
      }
      
      // Only set error if the URL has been entered but is invalid
      if (url.includes('github.com')) {
        setError('Please enter a valid GitHub repository URL');
      } else {
        setError(''); // Don't show error for non-GitHub URLs unless submitting
      }
      
      return false;
    } catch (err) {
      // Only set error if the URL has been entered but is invalid
      if (url.length > 10) {
        setError('Please enter a valid GitHub repository URL');
      } else {
        setError(''); // Don't show error for partial URLs
      }
      
      // Not a valid URL
      setOwner('');
      setRepo('');
      return false;
    }
  };

  // Handle repo URL change
  const handleRepoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setRepoUrl(url);
    
    // Only validate if URL is long enough to potentially be valid
    if (url.length > 10) {
      parseGitHubUrl(url);
    } else {
      // Clear error for short URLs
      setError('');
      setOwner('');
      setRepo('');
    }
  };

  // Fetch GitHub data for a specific URL
  const fetchGitHubDataForUrl = async (url: string) => {
    if (!url.trim()) {
      return; // Skip validation for empty URL
    }
    
    if (!parseGitHubUrl(url)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    await fetchGitHubData();
  };

  // Fetch data from GitHub API
  const fetchGitHubData = async () => {
    if (!owner || !repo) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch commits
      const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`);
      if (!commitsResponse.ok) {
        throw new Error(`Failed to fetch commits: ${commitsResponse.statusText}`);
      }
      const commitsData = await commitsResponse.json();
      setCommits(commitsData);

      // Fetch issues
      const issuesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?per_page=10&state=all`);
      if (!issuesResponse.ok) {
        throw new Error(`Failed to fetch issues: ${issuesResponse.statusText}`);
      }
      const issuesData = await issuesResponse.json();
      setIssues(issuesData);
    } catch (err) {
      setError('Error fetching GitHub data. Make sure the repository exists and is public.');
      console.error('Error fetching GitHub data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate commit message if too long
  const truncateMessage = (message: string, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-purple-50/90 to-indigo-100/90 dark:from-purple-900/20 dark:to-indigo-900/20 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 font-black text-base sm:text-lg">
              <Github className="h-5 w-5" />
              {projectName ? `${projectName} - GITHUB ACTIVITY` : 'GITHUB REPOSITORY ACTIVITY'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
              value={repoUrl}
              onChange={handleRepoUrlChange}
              className="flex-1"
              disabled={!isEditing && savedRepoUrl !== ''}
            />
            
            {savedRepoUrl !== '' && !isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 border-2 border-black dark:border-gray-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit URL
              </Button>
            ) : savedRepoUrl !== '' ? (
              <Button 
                onClick={saveRepositoryUrl} 
                disabled={saving}
                className="bg-black text-white dark:bg-white dark:text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                {saving ? 'Saving...' : 'Save URL'}
                {!saving && <Save className="ml-2 h-4 w-4" />}
              </Button>
            ) : (
              <Button 
                onClick={saveRepositoryUrl} 
                disabled={saving || !owner || !repo}
                className="bg-black text-white dark:bg-white dark:text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                {saving ? 'Saving...' : 'Save Repository'}
                {!saving && <Save className="ml-2 h-4 w-4" />}
              </Button>
            )}
            
            <Button 
              onClick={fetchGitHubData} 
              disabled={loading || !owner || !repo}
              className="bg-black text-white dark:bg-white dark:text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
            >
              {loading ? 'Loading...' : 'Fetch Activity'}
              {!loading && <Search className="ml-2 h-4 w-4" />}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {savedRepoUrl && !isEditing && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Repository URL saved for this project</span>
            </div>
          )}
          
          {owner && repo && !error && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Repository: <span className="font-semibold">{owner}/{repo}</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {(commits.length > 0 || issues.length > 0) && (
        <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Tabs defaultValue="commits">
            <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-green-50/90 to-emerald-100/90 dark:from-green-900/20 dark:to-emerald-900/20 p-4">
              <TabsList className="grid grid-cols-2 w-full sm:w-64">
                <TabsTrigger value="commits" className="flex items-center gap-1">
                  <GitCommit className="h-4 w-4" />
                  Commits
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Issues
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="p-4">
              <TabsContent value="commits" className="mt-0">
                {commits.length > 0 ? (
                  <div className="space-y-3">
                    {commits.map((commit) => (
                      <div 
                        key={commit.sha} 
                        className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-black/10 dark:border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{truncateMessage(commit.commit.message)}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span>{commit.author?.login || commit.commit.author.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(commit.commit.author.date)}</span>
                              </div>
                              <a 
                                href={commit.html_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>View on GitHub</span>
                              </a>
                            </div>
                          </div>
                          {commit.author?.avatar_url && (
                            <img 
                              src={commit.author.avatar_url} 
                              alt={commit.author.login} 
                              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No commits found. Try fetching repository data first.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="issues" className="mt-0">
                {issues.length > 0 ? (
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <div 
                        key={issue.number} 
                        className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-black/10 dark:border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                issue.state === 'open' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              }`}>
                                {issue.state === 'open' ? 'Open' : 'Closed'}
                              </span>
                              <p className="font-medium">{issue.title}</p>
                            </div>
                            
                            <div className="mt-2 flex flex-wrap gap-1">
                              {issue.labels.map((label, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: `#${label.color}22`, 
                                    color: `#${label.color}`,
                                    border: `1px solid #${label.color}44`
                                  }}
                                >
                                  {label.name}
                                </span>
                              ))}
                            </div>
                            
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span>{issue.user.login}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(issue.created_at)}</span>
                              </div>
                              <a 
                                href={issue.html_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>View on GitHub</span>
                              </a>
                            </div>
                          </div>
                          <img 
                            src={issue.user.avatar_url} 
                            alt={issue.user.login} 
                            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No issues found. Try fetching repository data first.
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
} 