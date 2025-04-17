import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VideoConferenceJoin from "@/components/VideoConferenceJoin";

export default async function VideoRoomPage({ params }: { params: { roomId: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { roomId } = params;

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="w-full">
        <h1 className="font-bold text-2xl mb-4">Video Conference</h1>
        <VideoConferenceJoin 
          roomId={roomId} 
          userId={user.id} 
          userName={user.email} 
        />
      </div>
    </div>
  );
} 