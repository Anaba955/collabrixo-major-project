// 'use client';

// import { useState } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { createClient } from '@/utils/supabase/client';
// import { useParams } from 'next/navigation';

// export default function AddMemberForm() {
//   const [email, setEmail] = useState('');
//   const [status, setStatus] = useState('');
//   const supabase = createClient();

// const params = useParams();
// const projectId = params.project_id as string;


//   const handleAddMember = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setStatus('');

//     if (!email || !projectId) {
//       setStatus('Missing email or project ID');
//       return;
//     }

//     // Step 1: Find user_id by email in profiles
//     const { data: user, error: userError } = await supabase
//       .from('profiles')
//       .select('id') // 'id' is the user ID
//       .eq('email', email)
//       .single();

//     if (userError || !user) {
//       setStatus('User not found with this email');
//       return;
//     }

//     const userId = user.id;

//     // Step 2: Fetch current team_members from project
//     const { data: project, error: projectError } = await supabase
//       .from('projects')
//       .select('team_members')
//       .eq('project_id', projectId)
//       .single();

//     if (projectError || !project) {
//       setStatus('Project not found');
//       return;
//     }

//     const currentMembers: string[] = project.team_members || [];

//     // Step 3: Prevent duplicate
//     if (currentMembers.includes(userId)) {
//       setStatus('User already in the team');
//       return;
//     }

//     const updatedMembers = [...currentMembers, userId];

//     // Step 4: Update project with new team_members
//     const { error: updateError } = await supabase
//       .from('projects')
//       .update({ team_members: updatedMembers })
//       .eq('project_id', projectId);

//     if (updateError) {
//       setStatus('Failed to add user to project');
//     } else {
//       setStatus('User successfully added to the team!');
//       setEmail('');
//     }
//   };

//   return (
//     <form onSubmit={handleAddMember} className="space-y-4 max-w-md">
//       <input
//         type="email"
//         placeholder="Enter user's email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="w-full border border-gray-300 p-2 rounded"
//         required
//       />
//       <button
//         type="submit"
//         className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//       >
//         Add Member
//       </button>
//       {status && <p className="text-sm text-gray-700">{status}</p>}
//     </form>
//   );
// }


'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AddMemberForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const params = useParams();
  const projectId = params.project_id as string;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');

    console.log('Debug: projectId from params:', projectId);
    console.log('Debug: email entered:', email);

    if (!email || !projectId) {
      if (!email) console.warn('Warning: Email is missing');
      if (!projectId) console.warn('Warning: Project ID is missing from URL params');
      setStatus('Missing email or project ID');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Find user by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !user) {
        console.error('User fetch error:', userError);
        setStatus('User not found with this email');
        setLoading(false);
        return;
      }

      const userId = user.id;

      // Step 2: Fetch current team members
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('team_members')
        .eq('project_id', projectId)
        .single();

      if (projectError || !project) {
        console.error('Project fetch error:', projectError);
        setStatus('Project not found');
        setLoading(false);
        return;
      }

      const currentMembers: string[] = project.team_members || [];

      // Step 3: Prevent duplicate members
      if (currentMembers.includes(userId)) {
        setStatus('User already in the team');
        setLoading(false);
        return;
      }

      // Step 4: Update project with new member list
      const updatedMembers = [...currentMembers, userId];

      const { error: updateError } = await supabase
        .from('projects')
        .update({ team_members: updatedMembers })
        .eq('project_id', projectId);

      if (updateError) {
        console.error('Update error:', updateError);
        setStatus('Failed to add user to project');
      } else {
        setStatus('User successfully added to the team!');
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setStatus('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddMember} className="space-y-4 max-w-md">
      <input
        type="email"
        placeholder="Enter user's email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-gray-300 p-2 rounded"
        required
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Adding...' : 'Add Member'}
      </button>
      {status && (
        <p
          className={`text-sm ${
            status.toLowerCase().includes('successfully') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}
