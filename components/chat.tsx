// // Example usage in a page component
// // pages/project/[id]/chat.tsx or app/project/[id]/chat/page.tsx
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router'; // or 'next/navigation' for app directory
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import TeamChat from '@/components/TChat';

// export default function ProjectChatPage() {
//   const router = useRouter();
//   const { id: projectId } = router.query;
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const supabase = createClientComponentClient();

//   useEffect(() => {
//     const getCurrentUser = async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       setCurrentUserId(user?.id || null);
//       setLoading(false);
//     };

//     getCurrentUser();
//   }, [supabase]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!currentUserId || !projectId) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p className="text-gray-500">Unable to load chat. Please try again.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
//         <TeamChat 
//           projectId={projectId as string} 
//           currentUserId={currentUserId} 
//         />
//       </div>
//     </div>
//   );
// }