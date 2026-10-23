import { useState, useEffect } from 'react';
import { auditRepository } from '../../storage/auditRepository';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { ScrollText, ShieldAlert, Filter } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const all = await auditRepository.getAuditLogs();
      setLogs(all);
    }
    load();
  }, []);

  const eventTypes = [
    'all',
    'DEMO_LOGIN',
    'DEMO_LOGOUT',
    'PROFILE_UPDATED',
    'INSTITUTION_PROFILE_UPDATED',
    'INSTITUTION_REGISTERED',
    'USER_STATUS_CHANGED',
    'DEMO_SEED_INITIALIZED',
  ];

  const filtered = logs.filter(
    (log) => eventTypeFilter === 'all' || log.eventType === eventTypeFilter
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          System Audit & Traceability Trail
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Structured prototype event stream recording authentication attempts, profile changes, and administrative actions.
        </p>
      </div>

      {/* Audit Log Tamper Disclaimer */}
      <div className="p-4 bg-[#FEF7EC] border border-[#E89B24] rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-[#C67C11] uppercase tracking-wider">
            Prototype Security Advisory:{' '}
          </span>
          The audit records below are currently stored in browser <code>localStorage</code> for demonstration and evaluation. Because client-side storage can be inspected or cleared by browser users, production deployment requires server-side write-only append logs backed by a tamper-resistant relational database.
        </div>
      </div>

      {/* Filter */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-[#0B1F54]">Event Type Filter:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0B1F54] cursor-pointer focus:outline-none"
          >
            {eventTypes.map((et) => (
              <option key={et} value={et}>
                {et === 'all' ? 'All Event Types' : et}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} of {logs.length} logged events
        </span>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#505F79] font-bold uppercase tracking-wider text-[10px] font-sans">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-3 py-3">Event Type</th>
                <th className="px-3 py-3">Actor (Role)</th>
                <th className="px-3 py-3">Target Entity</th>
                <th className="px-4 py-3 font-sans">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No audit records match the selected event type.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E8F0FE] text-[#174EA6] font-bold">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {log.actorId} <span className="text-slate-400">({log.actorRole})</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 truncate max-w-[120px]">
                      {log.targetEntityId}
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-[#0B1F54]">
                      {log.summary}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
