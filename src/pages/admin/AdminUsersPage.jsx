import { useState, useEffect } from 'react';
import { userRepository } from '../../storage/userRepository';
import { institutionRepository } from '../../storage/institutionRepository';
import { auditRepository } from '../../storage/auditRepository';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Users, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadUsers = async () => {
    const list = await userRepository.getAllUsers();
    setUsers(list);

    const instList = await institutionRepository.getAllInstitutions();
    const instMap = {};
    for (const inst of instList) {
      instMap[inst.id] = inst.name;
    }
    setInstitutions(instMap);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    setErrorMsg('');
    setFeedbackMsg('');
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      await userRepository.updateUserStatus(user.id, newStatus);
      await auditRepository.logEvent({
        eventType: 'USER_STATUS_CHANGED',
        actorId: currentUser?.id || 'admin',
        actorRole: 'admin',
        targetEntityId: user.id,
        summary: `Admin changed account status of ${user.name} to ${newStatus.toUpperCase()}`,
        metadata: { userId: user.id, previousStatus: user.status, newStatus },
      });

      setFeedbackMsg(`Account for "${user.name}" is now ${newStatus}.`);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          User Account Governance
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Manage prototype user accounts, adjust access privileges, and activate or deactivate institutional representatives.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-[#E6F4EA] border border-[#13805E]/30 rounded-xl text-xs flex items-center gap-3 text-[#13805E]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-xs text-[#0B1F54] uppercase tracking-wider">
            Registered Demo Users ({users.length})
          </span>
          <span className="text-[0.6875rem] text-slate-500">
            *Safety Rule Enforced: Last Admin cannot be deactivated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FB] border-b border-slate-200 text-[#505F79] font-bold uppercase tracking-wider text-[0.625rem]">
              <tr>
                <th className="px-4 py-3">Full Name & Office</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Email Address</th>
                <th className="px-3 py-3">Linked Institution</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="text-[0.625rem] font-semibold bg-[#174EA6]/10 text-[#174EA6] px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[0.6875rem] text-[#505F79]">{u.designation}</div>
                    </td>
                    <td className="px-3 py-3 font-mono">
                      <Badge
                        variant={u.role === 'admin' ? 'navy' : u.role === 'officer' ? 'saffron' : 'blue'}
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-3 py-3">
                      {u.institutionId ? institutions[u.institutionId] || u.institutionId : 'Central Bureau'}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={u.status === 'active' ? 'green' : 'gray'} size="sm">
                        {u.status === 'active' ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCurrent ? (
                        <span className="text-[0.6875rem] text-slate-400 font-semibold italic">Current Admin</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                            u.status === 'active'
                              ? 'text-red-600 hover:bg-red-50 border border-red-200'
                              : 'text-[#13805E] hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
