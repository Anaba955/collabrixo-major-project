import { Calendar } from "@/components/ui/calendar"
import Chat from  "../../components/Chat"
import TeamMembers from '../../components/OnlineMembers';
import OnlineMembers from "../../components/OnlineMembers";
// Example inside any component
import Link from 'next/link';



const Dashboard = () => {
  const onlineUsers = [
    { id: 1, name: "Shoaib" },
    { id: 2, name: "Ayaan" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Calendar />
      <Chat />
      <OnlineMembers />
    </div>
  );
};

export default Dashboard;
