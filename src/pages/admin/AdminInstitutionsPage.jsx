import { useState, useEffect } from 'react';
import { institutionRepository } from '../../storage/institutionRepository';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Building2, Search } from 'lucide-react';

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const list = await institutionRepository.getAllInstitutions();
      setInstitutions(list);
    }
    load();
  }, []);

  const filtered = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.aisheCode.toLowerCase().includes(query.toLowerCase()) ||
      i.state.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          Registered Institutions Master Directory
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          System-wide directory of all institutions onboarded into the NidhiSetu repository.
        </p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search institutions by name, AISHE code, or state..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-lg text-xs text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#505F79] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Institution Name</th>
                <th className="px-3 py-3">AISHE Code</th>
                <th className="px-3 py-3">State / City</th>
                <th className="px-3 py-3">Representative</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0B1F54]">
              {filtered.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold">{inst.name}</div>
                    <div className="text-[11px] text-[#505F79]">{inst.type}</div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-[#174EA6]">
                    {inst.aisheCode}
                  </td>
                  <td className="px-3 py-3">
                    {inst.city}, {inst.state}
                  </td>
                  <td className="px-3 py-3">
                    <div>{inst.representativeName}</div>
                    <div className="text-[10px] text-slate-500">{inst.representativeEmail}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={inst.status === 'active' ? 'green' : 'gray'} size="sm">
                      {inst.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
