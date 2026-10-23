import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Archive,
  RefreshCw,
  ExternalLink,
  Info,
  Calendar,
  Building,
  Check,
  X,
} from 'lucide-react';
import { complianceRuleRepository } from '../../storage/complianceRuleRepository';
import {
  RULE_STATUSES,
  REGULATORY_AUTHORITIES,
  INSTITUTION_CATEGORIES,
  PROGRAM_CATEGORIES,
  createDefaultRule,
} from '../../compliance/complianceRuleModel';
import { PROTOTYPE_COMPLIANCE_DISCLAIMER } from '../../compliance/complianceDemoFixtures';

export default function AdminComplianceRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [authorityFilter, setAuthorityFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE | EDIT
  const [activeRule, setActiveRule] = useState(null);
  const [formData, setFormData] = useState(createDefaultRule());
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Retirement modal
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState(null);
  const [retireReason, setRetireReason] = useState('Superseded by updated regulatory framework');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await complianceRuleRepository.getAllRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData(createDefaultRule());
    setFormError('');
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    if (rule.ruleStatus !== RULE_STATUSES.DRAFT) {
      alert('Activated or Retired rules are immutable. Use "Clone as Draft" to create a new version.');
      return;
    }
    setFormData({ ...rule });
    setActiveRule(rule);
    setFormError('');
    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (modalMode === 'CREATE') {
        await complianceRuleRepository.createRule({
          ...formData,
          minimumDepositPaise: Number(formData.minimumDepositPaise),
          requiredValidityMonths: Number(formData.requiredValidityMonths),
        });
        setSuccessMessage('Compliance rule created successfully.');
      } else {
        await complianceRuleRepository.updateDraftRule(activeRule.ruleId, {
          ...formData,
          minimumDepositPaise: Number(formData.minimumDepositPaise),
          requiredValidityMonths: Number(formData.requiredValidityMonths),
        });
        setSuccessMessage('Draft compliance rule updated.');
      }
      setIsModalOpen(false);
      loadRules();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to save rule.');
    }
  };

  const handleActivateRule = async (ruleId) => {
    try {
      await complianceRuleRepository.activateRule(ruleId);
      setSuccessMessage('Rule activated successfully. Applicable to subsequent assessments.');
      loadRules();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(`Activation Error: ${err.message}`);
    }
  };

  const handleCloneRule = async (ruleId) => {
    try {
      const cloned = await complianceRuleRepository.cloneRule(ruleId);
      setSuccessMessage(`Cloned rule into draft version: ${cloned.ruleCode}`);
      loadRules();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(`Clone Failed: ${err.message}`);
    }
  };

  const handleRetireClick = (rule) => {
    setRetireTarget(rule);
    setRetireReason('Superseded by updated regulatory framework');
    setRetireModalOpen(true);
  };

  const handleConfirmRetire = async () => {
    if (!retireTarget) return;
    try {
      await complianceRuleRepository.retireRule(retireTarget.ruleId, retireReason);
      setSuccessMessage(`Retired rule ${retireTarget.ruleCode}. Historical assessments remain intact.`);
      setRetireModalOpen(false);
      setRetireTarget(null);
      loadRules();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(`Retirement failed: ${err.message}`);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset compliance rules to baseline synthetic demonstration rules?')) {
      await complianceRuleRepository.resetToDemoRules();
      loadRules();
      setSuccessMessage('Compliance rules restored to demo baseline.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const filteredRules = rules.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.ruleCode.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      r.regulatoryAuthority.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || r.ruleStatus === statusFilter;
    const matchesAuth = authorityFilter === 'ALL' || r.regulatoryAuthority === authorityFilter;
    return matchesSearch && matchesStatus && matchesAuth;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Governance</span>
            <span>/</span>
            <span className="text-[#174EA6]">Regulatory Rules</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F54] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#174EA6]" />
            Regulatory Deposit Rules Engine
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configure, version, and manage institutional security deposit requirements for compliance evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset Demo Rules
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#174EA6] rounded-md hover:bg-[#0B1F54] shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Configure New Rule
          </button>
        </div>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-xs">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PROTOTYPE NOTICE: </span>
          {PROTOTYPE_COMPLIANCE_DISCLAIMER} Rules configured here determine automated adequacy and shortfall assessments for demonstrations.
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by rule code, title, authority..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#174EA6] focus:border-[#174EA6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white focus:ring-1 focus:ring-[#174EA6]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="RETIRED">RETIRED</option>
          </select>

          <select
            value={authorityFilter}
            onChange={(e) => setAuthorityFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white focus:ring-1 focus:ring-[#174EA6]"
          >
            <option value="ALL">All Authorities</option>
            {Object.values(REGULATORY_AUTHORITIES).map((auth) => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Rule Code & Version</th>
                <th className="py-3 px-4">Title & Scope</th>
                <th className="py-3 px-4">Authority</th>
                <th className="py-3 px-4">Required Deposit</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Effective Window</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    Loading compliance rules...
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No regulatory rules found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isDraft = rule.ruleStatus === RULE_STATUSES.DRAFT;
                  const isActive = rule.ruleStatus === RULE_STATUSES.ACTIVE;
                  const isRetired = rule.ruleStatus === RULE_STATUSES.RETIRED;

                  return (
                    <tr key={rule.ruleId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        <div>{rule.ruleCode}</div>
                        <span className="text-[10px] text-slate-500 font-sans">
                          v{rule.ruleVersion || 1}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0B1F54] max-w-xs truncate" title={rule.title}>
                          {rule.title}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{rule.institutionCategory}</span>
                          <span>•</span>
                          <span>{rule.programCategory}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-blue-50 text-[#174EA6] border border-blue-100">
                          {rule.regulatoryAuthority}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        ₹{((rule.minimumDepositPaise || 0) / 100).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {rule.requiredValidityMonths} Months
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        <div>{rule.effectiveFrom}</div>
                        <div className="text-[10px] text-slate-400">to {rule.effectiveTo || 'Ongoing'}</div>
                      </td>

                      <td className="py-3 px-4">
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ACTIVE
                          </span>
                        )}
                        {isDraft && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            DRAFT
                          </span>
                        )}
                        {isRetired && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            RETIRED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isDraft && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(rule)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleActivateRule(rule.ruleId)}
                                className="px-2 py-1 text-[11px] font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                              >
                                Activate
                              </button>
                            </>
                          )}

                          {isActive && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCloneRule(rule.ruleId)}
                                title="Clone into new draft version"
                                className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Clone v{(rule.ruleVersion || 1) + 1}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRetireClick(rule)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                              >
                                Retire
                              </button>
                            </>
                          )}

                          {isRetired && (
                            <button
                              type="button"
                              onClick={() => handleCloneRule(rule.ruleId)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Re-activate Draft
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#0B1F54] text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                {modalMode === 'CREATE' ? 'Configure New Regulatory Deposit Rule' : `Edit Draft Rule: ${formData.ruleCode}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.ruleCode}
                    onChange={(e) => setFormData({ ...formData, ruleCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                    placeholder="e.g. AICTE-ENG-UG-2024"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Regulatory Authority *</label>
                  <select
                    value={formData.regulatoryAuthority}
                    onChange={(e) => setFormData({ ...formData, regulatoryAuthority: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    {Object.values(REGULATORY_AUTHORITIES).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  placeholder="e.g. AICTE Undergraduate Engineering Standard Deposit Norm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institution Category *</label>
                  <select
                    value={formData.institutionCategory}
                    onChange={(e) => setFormData({ ...formData, institutionCategory: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    {Object.values(INSTITUTION_CATEGORIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program Category *</label>
                  <select
                    value={formData.programCategory}
                    onChange={(e) => setFormData({ ...formData, programCategory: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    {Object.values(PROGRAM_CATEGORIES).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Minimum Deposit (in Paise) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.minimumDepositPaise}
                    onChange={(e) => setFormData({ ...formData, minimumDepositPaise: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Equivalent: ₹{((Number(formData.minimumDepositPaise) || 0) / 100).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Required Validity (Months) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.requiredValidityMonths}
                    onChange={(e) => setFormData({ ...formData, requiredValidityMonths: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    e.g. 60 months (5 years)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective From *</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={formData.effectiveTo || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value || null })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Lien Beneficiary</label>
                <input
                  type="text"
                  value={formData.expectedLienBeneficiary || ''}
                  onChange={(e) => setFormData({ ...formData, expectedLienBeneficiary: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  placeholder="e.g. MEMBER SECRETARY AICTE NEW DELHI"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174EA6] hover:bg-[#0B1F54] text-white rounded-md font-semibold"
                >
                  {modalMode === 'CREATE' ? 'Create Draft Rule' : 'Save Draft Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Retire Rule Modal */}
      {retireModalOpen && retireTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-400" />
                Retire Compliance Rule
              </h3>
              <button onClick={() => setRetireModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700">
                Are you sure you want to retire <span className="font-mono font-bold">{retireTarget.ruleCode}</span>?
              </p>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-600">
                Historical assessments referencing this rule will remain completely preserved and auditable.
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Retirement Justification *</label>
                <textarea
                  rows="2"
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRetireModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRetire}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
                >
                  Confirm Retirement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
