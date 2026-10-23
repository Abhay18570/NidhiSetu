import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { notificationRepository } from '../../storage/notificationRepository';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Bell, CheckCheck, Clock, ShieldAlert, Award, Info, Trash2 } from 'lucide-react';

export default function InstitutionNotificationsPage() {
  const { currentUser, currentRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadNotifs = async () => {
    if (!currentUser) return;
    const list = await notificationRepository.getNotificationsForUser(currentUser.id, currentRole);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifs();
  }, [currentUser, currentRole]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await notificationRepository.markAllAsRead(currentUser.id, currentRole);
    await loadNotifs();
  };

  const handleMarkRead = async (id) => {
    await notificationRepository.markAsRead(id);
    await loadNotifs();
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'renewal') return n.category === 'renewal';
    return true;
  });

  const getIcon = (cat) => {
    switch (cat) {
      case 'renewal':
        return <Clock className="w-4 h-4 text-[#E89B24]" />;
      case 'scrutiny':
        return <ShieldAlert className="w-4 h-4 text-[#174EA6]" />;
      case 'welcome':
        return <Award className="w-4 h-4 text-[#13805E]" />;
      default:
        return <Info className="w-4 h-4 text-[#0B1F54]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            Institutional Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Maturity alerts, regulatory scrutiny updates, and system communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            size="sm"
            icon={CheckCheck}
            className="text-xs font-semibold"
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-[#0B1F54] text-white'
              : 'bg-white text-[#505F79] border border-[#D3DDEB] hover:bg-slate-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-[#0B1F54] text-white'
              : 'bg-white text-[#505F79] border border-[#D3DDEB] hover:bg-slate-50'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('renewal')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'renewal'
              ? 'bg-[#0B1F54] text-white'
              : 'bg-white text-[#505F79] border border-[#D3DDEB] hover:bg-slate-50'
          }`}
        >
          Renewal Notices
        </button>
      </div>

      {/* Notification List */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-[#505F79] space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <div className="text-sm font-semibold">No notifications in this filter</div>
            <p className="text-xs text-slate-400">All alerts are currently up to date.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkRead(item.id)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  !item.isRead ? 'bg-[#F5F7FB]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-[#D3DDEB] shrink-0 mt-0.5">
                    {getIcon(item.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B1F54]">{item.title}</span>
                      {!item.isRead && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#174EA6] text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#505F79] leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      Received on {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(item.id);
                    }}
                    className="text-xs text-[#174EA6] hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
