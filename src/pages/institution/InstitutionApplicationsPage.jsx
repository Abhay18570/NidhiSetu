import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { FileText, Clock, Sparkles, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstitutionApplicationsPage() {
  const { currentInstitution } = useAuth();

  // Demonstration application placeholder
  const sampleApplications = [
    {
      arn: 'ARN-2026-981240',
      type: 'Initial Course Approval Security Deposit',
      amount: '₹ 35,00,000 /-',
      bank: 'State Bank of India (IFSC: SBIN0004021)',
      submissionDate: '12 Oct 2026',
      status: 'Bank Branch Confirmed',
      stage: 'Under AICTE Scrutiny',
      badgeColor: 'blue',
    },
    {
      arn: 'ARN-2025-419082',
      type: 'Establishment Security Deposit (Polytechnic)',
      amount: '₹ 50,00,000 /-',
      bank: 'Bank of Baroda (IFSC: BARB0SHIVAJ)',
      submissionDate: '14 Aug 2025',
      status: 'Verified & Certified',
      stage: 'Acceptance Certificate Issued',
      badgeColor: 'green',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            FDR Submission & Verification Applications
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Monitor the scrutiny lifecycle of your institutional security deposit submissions via Application Reference Numbers (ARN).
          </p>
        </div>
      </div>

      {/* Module 03 Scope Banner */}
      <div className="p-4 bg-[#FEF7EC] border border-[#E89B24] rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#C67C11] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-[#C67C11] uppercase tracking-wider">
            Prototype Demonstration Status:{' '}
          </span>
          New FDR submissions and automated OCR ingestion workflows are scheduled for activation in <strong>Module 03</strong>. The records below demonstrate real-time status tracking for this institutional account.
        </div>
      </div>

      {/* Applications List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="font-bold text-xs text-[#0B1F54] uppercase tracking-wider">
            Active Submissions ({sampleApplications.length})
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            AISHE: {currentInstitution?.aisheCode || 'N/A'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {sampleApplications.map((app, idx) => (
            <div key={idx} className="p-5 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-[#174EA6]">{app.arn}</span>
                    <Badge variant={app.badgeColor} size="sm">
                      {app.status}
                    </Badge>
                  </div>
                  <div className="font-bold text-sm text-[#0B1F54]">{app.type}</div>
                  <div className="text-xs text-[#505F79]">{app.bank} &bull; Submitted on {app.submissionDate}</div>
                </div>

                <div className="text-left sm:text-right space-y-1 shrink-0">
                  <div className="text-sm font-extrabold text-[#13805E]">{app.amount}</div>
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center sm:justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#E89B24]" />
                    <span>{app.stage}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
