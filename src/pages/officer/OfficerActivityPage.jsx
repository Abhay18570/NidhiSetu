import { useState, useEffect } from 'react';
import { auditRepository } from '../../storage/auditRepository';
import Card from '../../components/common/Card';
import { Activity, Clock } from 'lucide-react';

export default function OfficerActivityPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const all = await auditRepository.getAuditLogs();
      setLogs(all);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          Officer Scrutiny & Assessment History
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Chronological record of scrutiny events, institutional evaluations, and session timestamps.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit logs recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#0B1F54]">{log.summary}</span>
                  <span className="font-mono text-[0.625rem] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[0.6875rem] text-slate-500 font-mono">
                  <span>Event: {log.eventType}</span>
                  <span>&bull;</span>
                  <span>Actor: {log.actorId} ({log.actorRole})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
