// components/OnlineMembers.tsx
'use client';

import React from 'react';

const members = [
  { name: 'Alice', online: true },
  { name: 'Bob', online: true },
  { name: 'Charlie', online: false },
];

const OnlineMembers = () => {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Team Members</h2>
      <ul>
        {members.map((member, index) => (
          <li key={index} className="flex items-center gap-2 mb-1">
            <span
              className={`w-3 h-3 rounded-full ${member.online ? 'bg-green-500' : 'bg-gray-400'}`}
            ></span>
            {member.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineMembers;
