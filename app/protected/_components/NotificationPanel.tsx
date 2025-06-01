import React, { useState, useEffect } from 'react';

export interface Notification {
  id: string | number;
  user: {
    name: string;
    image: string;
    bgColor: string;
  };
  action: string;
  target?: string;
  time: string;
  content?: React.ReactNode;
  isUnread: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  markAsRead: (id: string | number) => void;
  markAsUnread: (id: string | number) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, notifications, markAsRead, markAsUnread }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

  const unreadCount = notifications.filter(n => n.isUnread).length;
  const readCount = notifications.filter(n => !n.isUnread).length;

  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Centered panel with glassmorphism effect */}
      <div className="notification-panel fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[550px] bg-[#1C1C1E]/90 backdrop-blur-xl text-white rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-white/10">
          <div className="flex px-4">
            <div 
              className={`py-3 mr-5 cursor-pointer ${activeTab === 'unread' ? 'border-b-2 border-red-500' : 'text-gray-400'}`}
              onClick={() => setActiveTab('unread')}
            >
              <span className="font-medium">Unread</span>
              <span className="ml-2 px-1.5 py-0.5 bg-black/30 text-xs rounded-md">{unreadCount}</span>
            </div>
            <div 
              className={`py-3 cursor-pointer ${activeTab === 'read' ? 'border-b-2 border-red-500' : 'text-gray-400'}`}
              onClick={() => setActiveTab('read')}
            >
              <span className="font-medium">Read</span>
              <span className="ml-2 px-1.5 py-0.5 bg-black/30 text-xs rounded-md">{readCount}</span>
            </div>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {notifications
            .filter(notification => activeTab === 'unread' ? notification.isUnread : !notification.isUnread)
            .map(notification => (
              <div 
                key={notification.id} 
                className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors relative group"
              >
                {notification.isUnread && (
                  <div className="absolute right-4 top-4 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
                <div className="flex">
                  <div className="mr-3">
                    <div className={`h-10 w-10 rounded-full ${notification.user.bgColor} overflow-hidden`}>
                      <img src={notification.user.image} alt={notification.user.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline">
                      <span className="font-semibold">{notification.user.name}</span>
                      <span className="ml-2 text-gray-400">{notification.action}</span>
                      {notification.target && (
                        <span className="ml-1 font-semibold">{notification.target}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    {notification.content}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => notification.isUnread ? markAsRead(notification.id) : markAsUnread(notification.id)}
                      className="p-1.5 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                      title={notification.isUnread ? "Mark as read" : "Mark as unread"}
                    >
                      {notification.isUnread ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M12 20v.01" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          {activeTab === 'unread' && unreadCount === 0 && (
            <div className="p-8 text-center text-gray-400">
              <p>No unread notifications</p>
            </div>
          )}
          {activeTab === 'read' && readCount === 0 && (
            <div className="p-8 text-center text-gray-400">
              <p>No read notifications</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel; 