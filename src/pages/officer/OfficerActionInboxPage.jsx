import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Layers,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  UserCheck,
  Building2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  aggregateActionInbox,
  assignOfficerTask,
  computeOfficerWorkload,
  RISK_PRIORITY,
  SOURCE_MODULES,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
} from '../../commandCenter';

export default function OfficerActionInboxPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [officers, setOfficers] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [officerFilter, setOfficerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'dueDate' | 'recent'

  // Assignment Modal
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('Operational scrutiny reassignment');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const workload = await computeOfficerWorkload();
      setItems(workload.allTasksWithAssignments || []);
      setOfficers(workload.officerStats || []);
    } catch (err) {
      console.error('[NidhiSetu Action Inbox] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssignModal = (task) => {
    setSelectedTaskForAssign(task);
    setAssigneeId(task.assignedOfficerId || (officers[0]?.officerId || ''));
  };

  const handleExecuteAssignment = async () => {
    if (!selectedTaskForAssign || !assigneeId) return;
    setIsAssigning(true);
    try {
      await assignOfficerTask({
        actionId: selectedTaskForAssign.actionId,
        sourceModule: selectedTaskForAssign.sourceModule,
        sourceEntityId: selectedTaskForAssign.sourceEntityId,
        institutionId: selectedTaskForAssign.institutionId,
        assignedTo: assigneeId,
        assignedBy: currentUser?.email || 'officer',
        reason: assignmentReason,
        previousAssignee: selectedTaskForAssign.assignedOfficerId,
      });
      setSelectedTaskForAssign(null);
      await loadData();
    } catch (err) {
      console.error('[NidhiSetu Assignment] Failed:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Priority sorting weight
  const priorityWeight = {
    [RISK_PRIORITY.CRITICAL]: 5,
    [RISK_PRIORITY.HIGH]: 4,
    [RISK_PRIORITY.MEDIUM]: 3,
    [RISK_PRIORITY.LOW]: 2,
    [RISK_PRIORITY.INFORMATIONAL]: 1,
    [RISK_PRIORITY.INDETERMINATE]: 0,
  };

  const filteredItems = items
    .filter((item) => {
      if (moduleFilter !== 'ALL' && item.sourceModule !== moduleFilter) return false;
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (officerFilter === 'UNASSIGNED' && item.assignedOfficerId) return false;
      if (officerFilter !== 'ALL' && officerFilter !== 'UNASSIGNED' && String(item.assignedOfficerId) !== String(officerFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesInst = item.institutionName?.toLowerCase().includes(q);
        const matchesActionId = item.actionId?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesInst && !matchesActionId) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case RISK_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-300';
      case RISK_PRIORITY.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case RISK_PRIORITY.MEDIUM:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0B1F54] text-white rounded-xl p-6 shadow-md border border-[#162E73] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E89B24] text-slate-900 uppercase tracking-wider">
              Unified Queue
            </span>
            <span className="text-xs text-slate-300 font-mono">
              TOTAL TASKS: {items.length}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            Unified Scrutiny & Action Inbox
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Single cross-module inbox consolidating pending dockets across FDR submission scrutiny, OCR findings, simulated bank reviews, compliance inquiries, and renewal lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Inbox
          </Button>
        </div>
      </div>

      {/* Boundary Safeguard Banner */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900 flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <span className="font-semibold">Routing Notice: </span>
          This is an aggregation and officer assignment inbox. Clicking "Open Dossier" routes you directly to the authoritative domain workflow. No duplicate approval engine exists.
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search docket, FDR, institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Source Modules</option>
              <option value={SOURCE_MODULES.MODULE_03_FDR}>Module 03: FDR Scrutiny</option>
              <option value={SOURCE_MODULES.MODULE_04_DOC_INTEL}>Module 04: Document Intel</option>
              <option value={SOURCE_MODULES.MODULE_05_BANK_SIM}>Module 05: Bank Confirmations</option>
              <option value={SOURCE_MODULES.MODULE_06_COMPLIANCE}>Module 06: Compliance Cases</option>
              <option value={SOURCE_MODULES.MODULE_07_RENEWAL}>Module 07: Renewals</option>
              <option value={SOURCE_MODULES.MODULE_07_RELEASE}>Module 07: Releases</option>
              <option value={SOURCE_MODULES.MODULE_07_ESCALATION}>Module 07: Escalations</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value={RISK_PRIORITY.CRITICAL}>Critical Priority</option>
              <option value={RISK_PRIORITY.HIGH}>High Priority</option>
              <option value={RISK_PRIORITY.MEDIUM}>Medium Priority</option>
              <option value={RISK_PRIORITY.LOW}>Low Priority</option>
            </select>
          </div>

          <div>
            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned Tasks Only</option>
              {officers.map((off) => (
                <option key={off.officerId} value={off.officerId}>
                  {off.officerName} ({off.openTasksCount})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white text-slate-700"
            >
              <option value="priority">Sort by Priority (Desc)</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="recent">Sort by Most Recent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1F54] text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Task Details & Entity</th>
                <th className="py-3 px-4">Source Module</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">Due Date / Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Loading action inbox...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No actionable tasks match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.actionId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 align-top">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top space-y-0.5">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{item.institutionName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        ID: {item.actionId}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {item.sourceModule.replace('MODULE_', 'M')}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{item.actionType}</div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      {item.assignedOfficerId ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {officers.find((o) => String(o.officerId) === String(item.assignedOfficerId))?.officerName || item.assignedOfficerId}
                          </span>
                          <button
                            onClick={() => handleOpenAssignModal(item)}
                            className="block text-[10px] text-blue-600 hover:underline mt-0.5"
                          >
                            Reassign
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(item)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                        >
                          + Assign Officer
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="font-medium text-slate-800">{item.status}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Due: {item.dueDate ? item.dueDate.split('T')[0] : 'Open cycle'}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top text-right space-x-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(item.destinationRoute)}
                        className="bg-[#0B1F54] hover:bg-[#162E73] text-white text-xs"
                      >
                        Open Dossier <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Task Assignment Modal */}
      {selectedTaskForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Assign / Reassign Scrutiny Task
              </h3>
              <button
                onClick={() => setSelectedTaskForAssign(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Target Task: </span>
                <span className="text-slate-900 font-medium">{selectedTaskForAssign.title}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Institution: </span>
                <span className="text-slate-900">{selectedTaskForAssign.institutionName}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign To Officer:
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  {officers.map((off) => (
                    <option key={off.officerId} value={off.officerId}>
                      {off.officerName} ({off.openTasksCount} current tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrative Reason / Justification:
                </label>
                <textarea
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Record formal justification for task allocation..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTaskForAssign(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isAssigning}
                onClick={handleExecuteAssignment}
                className="bg-[#0B1F54] text-white"
              >
                {isAssigning ? 'Saving...' : 'Confirm Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
