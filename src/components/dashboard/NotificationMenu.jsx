import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { notificationRepository } from '../../storage/notificationRepository';
import { Bell, CheckCheck, Clock, Info, ShieldAlert, Award } from 'lucide-react';

export default function NotificationMenu() {
  const { currentUser, currentRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const fetchNotifs = async () => {
    if (!currentUser) return;
    const list = await notificationRepository.getNotificationsForUser(currentUser.id, currentRole);
    setNotifications(list);
  };

  useEffect(() => {
    fetchNotifs();
  }, [currentUser, currentRole]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await notificationRepository.markAllAsRead(currentUser.id, currentRole);
    await fetchNotifs();
  };

  const handleMarkOneRead = async (id) => {
    await notificationRepository.markAsRead(id);
    await fetchNotifs();
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'renewal':
        return <Clock className="w-3.5 h-3.5 text-[#E89B24]" />;
      case 'scrutiny':
        return <ShieldAlert className="w-3.5 h-3.5 text-[#174EA6]" />;
      case 'welcome':
        return <Award className="w-3.5 h-3.5 text-[#13805E]" />;
      default:
        return <Info className="w-3.5 h-3.5 text-[#0B1F54]" />;
    }
  };

  return (
    <div className="static sm:relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-[#0B1F54] hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#174EA6]"
        aria-expanded={isOpen}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-[#E89B24] text-[#0B1F54] text-[0.625rem] font-black leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-4 top-full sm:right-0 sm:top-auto mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-[#D3DDEB] py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
          role="dialog"
          aria-label="Notifications Panel"
        >
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0B1F54] text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-[#E8F0FE] text-[#174EA6]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[0.6875rem] font-semibold text-[#174EA6] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-1 opacity-30" />
                <span>No notifications yet.</span>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkOneRead(notif.id)}
                  className={`p-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !notif.isRead ? 'bg-[#F5F7FB] font-medium' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-md bg-white border border-[#D3DDEB] shrink-0 mt-0.5">
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#0B1F54] line-clamp-1">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#174EA6] shrink-0" />
                        )}
                      </div>
                      <p className="text-[0.6875rem] text-[#505F79] mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[0.625rem] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
            <Link
              to={currentRole === 'institution' ? '/institution/notifications' : '#'}
              onClick={() => setIsOpen(false)}
              className="text-[0.6875rem] font-bold text-[#174EA6] hover:underline"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
