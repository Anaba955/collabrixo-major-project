"use client";
import { useState } from "react";
import TabsSection from "../_components/TabsSection";
import { useParams } from "next/navigation";
import { Video } from "lucide-react";

export default function Home() {
  const params = useParams();
  const projectId = params?.projectId || params?.id || (Array.isArray(params?.slug) ? params.slug[params.slug.length - 1] : undefined);
  const handleVideoClick = () => {
    if (projectId) {
      window.open(`https://meet.jit.si/project-${projectId}`, '_blank');
    } else {
      alert("Project ID not found in URL.");
    }
  };

  return (
    <div className="flex-1 transition-all duration-300 px-4 ml-0 relative min-h-screen">
      <TabsSection />
      
      <button
        onClick={handleVideoClick}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-colors duration-200"
        title="Join Project Video Call"
        aria-label="Join Project Video Call"
      >
        <Video size={32} />
      </button>
    </div>
  );
}