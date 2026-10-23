import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { FileCheck2, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function OfficerCasesPage() {
  const cases = [
    {
      caseNo: 'CASE-2026-W-109',
      institution: 'College of Engineering & Technology Pune',
      subject: 'Quinquennial FDR Tenure Renewal Scrutiny',
      assignedDate: '18 Oct 2026',
      dueDate: '28 Oct 2026',
      status: 'Under Review',
      badgeColor: 'blue',
    },
    {
      caseNo: 'CASE-2026-W-094',
      institution: 'Apex Institute of Technology & Management',
      subject: 'New Technical Program Security Deposit Clearance',
      assignedDate: '05 Oct 2026',
      dueDate: '15 Oct 2026',
      status: 'Scrutiny Cleared',
      badgeColor: 'green',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F54]">
          Assigned Regulatory Review Cases
        </h1>
        <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
          Detailed case dockets assigned to this scrutiny officer seat for institutional compliance determination.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {cases.map((cs) => (
            <div key={cs.caseNo} className="p-5 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#174EA6]">{cs.caseNo}</span>
                    <Badge variant={cs.badgeColor} size="sm">
                      {cs.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-[#0B1F54]">{cs.subject}</h3>
                  <div className="text-xs text-[#505F79]">{cs.institution}</div>
                </div>

                <div className="text-left sm:text-right text-xs text-[#505F79] space-y-1">
                  <div>Assigned: <span className="font-medium text-[#0B1F54]">{cs.assignedDate}</span></div>
                  <div>Target Due: <span className="font-medium text-rose-600">{cs.dueDate}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
