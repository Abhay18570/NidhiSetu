import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { institutionRepository } from '../../storage/institutionRepository';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Search, Filter, Eye, X, Building2, MapPin, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

export default function OfficerInstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedInst, setSelectedInst] = useState(null);

  useEffect(() => {
    async function load() {
      const list = await institutionRepository.getAllInstitutions();
      setInstitutions(list);

      const inspectId = searchParams.get('inspect');
      if (inspectId) {
        const target = list.find((i) => i.id === inspectId);
        if (target) setSelectedInst(target);
      }
    }
    load();
  }, [searchParams]);

  const states = ['all', 'Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Delhi', 'Karnataka'];

  const filtered = institutions.filter((inst) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inst.name.toLowerCase().includes(query) ||
      inst.aisheCode.toLowerCase().includes(query) ||
      inst.representativeName?.toLowerCase().includes(query) ||
      inst.city?.toLowerCase().includes(query);
    const matchesState = stateFilter === 'all' || inst.state === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            Institution Registry & Compliance Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Search, inspect, and evaluate educational institutions registered within the regional scrutiny bureau.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by college name, AISHE code, or representative..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1F54] cursor-pointer focus:outline-none"
          >
            {states.map((st) => (
              <option key={st} value={st}>
                {st === 'all' ? 'All States' : st}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Institution Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#505F79] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Institution Name & Type</th>
                <th className="px-3 py-3">AISHE / PID</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Signatory</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No institutions match the current search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#0B1F54]">{inst.name}</div>
                      <div className="text-[11px] text-[#505F79]">{inst.type}</div>
                    </td>
                    <td className="px-3 py-3 font-mono">
                      <div className="font-bold text-[#174EA6]">{inst.aisheCode}</div>
                      <div className="text-[10px] text-slate-400">{inst.aictePid || 'No PID'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{inst.city}, {inst.state}</div>
                      <div className="text-[10px] text-slate-400">PIN: {inst.pincode}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{inst.representativeName}</div>
                      <div className="text-[10px] text-slate-500">{inst.representativeDesignation}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={inst.status === 'active' ? 'green' : 'gray'} size="sm">
                        {inst.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        onClick={() => setSelectedInst(inst)}
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        className="text-xs"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side Inspect Drawer / Modal */}
      {selectedInst && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-[#D3DDEB] max-w-2xl w-full p-6 gov-shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#174EA6]">
                  Institutional Scrutiny Dossier
                </span>
                <h2 className="text-xl font-bold text-[#0B1F54] mt-0.5">
                  {selectedInst.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-[#174EA6] bg-[#E8F0FE] px-2 py-0.5 rounded">
                    AISHE: {selectedInst.aisheCode}
                  </span>
                  <Badge variant="green" size="sm">
                    {selectedInst.approvalStatus}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInst(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#F5F7FB] rounded-lg">
                <span className="text-slate-500 block">Institution Category:</span>
                <span className="font-bold text-[#0B1F54] text-sm">{selectedInst.category}</span>
              </div>

              <div className="p-3 bg-[#F5F7FB] rounded-lg">
                <span className="text-slate-500 block">Year Established:</span>
                <span className="font-bold text-[#0B1F54] text-sm">{selectedInst.establishmentYear}</span>
              </div>

              <div className="p-3 bg-[#F5F7FB] rounded-lg sm:col-span-2">
                <span className="text-slate-500 block">Campus Address:</span>
                <span className="font-semibold text-[#0B1F54]">
                  {selectedInst.address}, {selectedInst.city}, {selectedInst.state} - {selectedInst.pincode}
                </span>
              </div>

              <div className="p-3 bg-[#F5F7FB] rounded-lg">
                <span className="text-slate-500 block">Authorized Representative:</span>
                <span className="font-bold text-[#0B1F54] text-sm">{selectedInst.representativeName}</span>
                <span className="text-slate-500 block text-[11px]">{selectedInst.representativeDesignation}</span>
              </div>

              <div className="p-3 bg-[#F5F7FB] rounded-lg">
                <span className="text-slate-500 block">Contact Credentials:</span>
                <span className="font-semibold text-[#0B1F54] block">{selectedInst.representativeEmail}</span>
                <span className="font-mono text-slate-600">{selectedInst.representativePhone}</span>
              </div>
            </div>

            <div className="p-4 bg-[#FEF7EC] border border-[#E89B24]/40 rounded-xl text-xs space-y-1">
              <span className="font-bold text-[#0B1F54]">Regulatory Officer Note:</span>
              <p className="text-[#505F79] leading-relaxed">
                Self-declared approval documents and joint FDR endorsements will be verified against bank branch ledger confirmations in Module 03.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button onClick={() => setSelectedInst(null)} variant="primary" size="sm">
                Close Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
