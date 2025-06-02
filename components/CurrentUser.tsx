// import { useEffect, useState } from "react";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// // Define User type locally if not available from module
// type User = {
//   id: string;
//   username: string;
//   email: string;
//   avatar_url: string;
// };

// export function useCurrentUser() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const supabase = createClientComponentClient();

//   useEffect(() => {
//     const fetchUser = async () => {
//       const { data: { user: authUser }, error } = await supabase.auth.getUser();
//       if (error || !authUser) {
//         console.error("Error fetching auth user:", error);
//         setLoading(false);
//         return;
//       }

//       const { data: profile, error: profileError } = await supabase
//         .from("profiles")
//         .select("id, username, email, avatar_url")
//         .eq("id", authUser.id)
//         .single();

//       if (profileError) {
//         console.error("Error fetching profile:", profileError);
//       } else {
//         setUser(profile as User);
//       }

//       setLoading(false);
//     };

//     fetchUser();
//   }, [supabase]);

//   return { user, loading };
// }


import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Define User type locally if not imported
type User = {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
};

export function useCurrentUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Failed to load user profile.");
        } else {
          setUser(profile as User);
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        setError("Unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      setLoading(false);
      setError("No user ID provided.");
    }
  }, [supabase, userId]);

  return { user, loading, error };
}
