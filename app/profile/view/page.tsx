"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JeemBackground from '../../protected/_components/JeemBackground';

export default function ProfileViewInstructions() {
  return (
    <div className="p-4 md:p-8 lg:p-10 bg-transparent min-h-screen flex items-center justify-center">
      <JeemBackground opacity={0.7} blurAmount={120} speed={35} />
      
      <Card className="border-2 border-black dark:border-gray-800 bg-white/70 backdrop-blur-lg dark:bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full">
        <CardHeader className="border-b-2 border-black dark:border-gray-800 bg-gradient-to-r from-blue-50/90 to-blue-100/90 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
          <CardTitle className="font-black text-xl">Public Profile Viewer</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">How to view a public profile</h2>
            <p>To view a user's public profile, you need a direct link from them. Profile links look like:</p>
            <div className="p-3 bg-black/10 dark:bg-white/10 rounded-md font-mono text-sm overflow-x-auto">
              {`${window.location.origin}/profile/view/[profile-token]`}
            </div>
            
            <p className="mt-4">When someone shares their profile with you, you'll receive a link that contains their unique profile token. Simply click on that link to view their public profile.</p>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-bold mb-4">Create your own public profile</h2>
            <p className="mb-4">Want to share your own profile? Follow these steps:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Log in to your account</li>
              <li>Go to your Profile page</li>
              <li>Click the Share button in the Activity Visualization section</li>
              <li>Copy the generated link and share it with others</li>
            </ol>
          </div>
          
          <div className="flex justify-center pt-4">
            <Link 
              href="/"
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-md shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(128,128,128,1)] transition-all"
            >
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 