// components/Chat.tsx
'use client';

import React, { useState } from 'react';

const Chat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow h-96 flex flex-col">
      <h2 className="text-lg font-bold mb-2">Team Chat</h2>
      <div className="flex-1 overflow-y-auto mb-2 border rounded p-2">
        {messages.map((msg, i) => (
          <div key={i} className="mb-1 text-sm text-gray-700">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border rounded p-2 text-sm"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button className="ml-2 px-4 bg-blue-500 text-white rounded" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
