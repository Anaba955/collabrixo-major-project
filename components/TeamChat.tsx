
"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client"; // Adjust the import path as necessary

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export default function TeamChat({projectId,currentUserId,}: {projectId: string;currentUserId: string;})
 {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await createClient()
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) console.error("Load messages error:", error);
      else setMessages(data || []);
    };

    loadMessages();

    const channel = createClient()
      .channel("project-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      createClient().removeChannel(channel);
    };
  }, [projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await createClient().from("messages").insert({
      project_id: projectId,
      user_id: currentUserId,
      content: newMessage.trim(),
    });

    if (error) console.error("Send message error:", error);
    else setNewMessage("");
  };

  return (
    <div className="border rounded p-4 flex flex-col h-[400px] max-w-lg">
      <div className="flex-1 overflow-y-auto mb-2 space-y-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${
              msg.user_id === currentUserId ? "text-right" : "text-left"
            }`}
          >
            <span className="inline-block px-3 py-1 bg-purple-100 rounded-md max-w-[80%] break-words">
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          className="flex-1 border rounded p-2" type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage} className="bg-purple-600 text-white rounded px-4 py-2">
          Send
        </button>
      </div>
    </div>
  );
}
