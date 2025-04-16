// components/FeatureSection.tsx

import React from "react";
import {
  Brain,
  Users,
  CheckCircle,
  LayoutDashboard,
  KanbanSquare,
  MessageCircle,
  Calendar,
  GitBranch,
  Bot,
} from "lucide-react";

const features = [
  {
    title: "AI-Powered Productivity",
    description:
      "Let our intelligent assistant optimize your task flow with smart suggestions.",
    icon: <Brain size={40} className="text-teal-400" />,
  },
  {
    title: "Real-Time Team Collaboration",
    description:
      "Chat, assign tasks, and work with your team — all in real time, no refresh needed.",
    icon: <Users size={40} className="text-teal-400" />,
  },
  {
    title: "GTD Task Management",
    description:
      "Built around the Getting Things Done methodology to keep you focused and efficient.",
    icon: <CheckCircle size={40} className="text-teal-400" />,
  },
  {
    title: "Interactive Dashboard",
    description:
      "Track project metrics, deadlines, and team activity all in one visual dashboard.",
    icon: <LayoutDashboard size={40} className="text-teal-400" />,
  },
  {
    title: "Kanban Board",
    description:
      "Visually manage your tasks with a drag-and-drop kanban board tailored to your workflow.",
    icon: <KanbanSquare size={40} className="text-teal-400" />,
  },
  {
    title: "Built-in Chat",
    description:
      "Stay in sync with your team using real-time chat embedded into every project workspace.",
    icon: <MessageCircle size={40} className="text-teal-400" />,
  },
  {
    title: "Calendar View",
    description:
      "View all your tasks and deadlines in an intuitive calendar format.",
    icon: <Calendar size={40} className="text-teal-400" />,
  },
  {
    title: "Git Integration",
    description:
      "Connect your repositories for seamless version control and commit tracking.",
    icon: <GitBranch size={40} className="text-teal-400" />,
  },
  {
    title: "AI Analyzer",
    description:
      "Use our AI analyzer to detect bottlenecks, track productivity trends, and suggest improvements.",
    icon: <Bot size={40} className="text-teal-400" />,
  },
];

const FeatureSection = () => {
  return (
    <section className="bg-neutral-950 text-white py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">What Makes Collabrixo Awesome</h2>
        <p className="text-neutral-400 mb-12 max-w-2xl mx-auto">
          Everything you need to streamline your workflow, manage projects, and
          collaborate — powered by AI.
        </p>

        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-neutral-900 p-6 rounded-2xl shadow-md hover:shadow-teal-500/30 transition"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-neutral-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
