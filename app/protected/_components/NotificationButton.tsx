import React from 'react';

interface NotificationButtonProps {
  count: number;
  onClick: () => void;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ count, onClick }) => {
  return (
    <button 
      className="notification-button relative w-12 h-12 border-2 border-black dark:border-white bg-white/70 backdrop-blur-lg dark:bg-gray-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-md flex items-center justify-center"
      onClick={onClick}
      aria-label="Show notifications"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full border-2 border-black text-xs font-bold text-white flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationButton; 