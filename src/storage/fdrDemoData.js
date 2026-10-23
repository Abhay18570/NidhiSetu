/**
 * NidhiSetu FDR Demo Data Definition
 * Provides deterministic, synthetic prototype FDR records covering all lifecycle states.
 * Strictly synthetic mock data; no actual banking credentials or real financial records are used.
 */

// Helper to construct dynamic calendar dates relative to today
const now = new Date();
const formatDate = (daysOffset) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const DEMO_FDR_RECORDS = [
  {
    id: 'fdr-demo-01',
    referenceNumber: 'FDR-2026-0001',
    institutionId: 'inst-demo-01', // College of Engineering & Technology Pune
    submittedBy: 'usr-demo-inst-01',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-22T14:30:00.000Z',
    submittedAt: '2026-08-20T10:15:00.000Z',
    // Bank Details
    bankName: 'State Bank of India',
    branchName: 'Shivajinagar Commercial Branch, Pune',
    branchAddress: 'F.C. Road, Shivajinagar, Pune, Maharashtra - 411004',
    ifsc: 'SBIN0001110',
    fdrNumber: 'SBI-FDR-9812401',
    accountHolderName: 'Principal, COEP Jointly with RO, AICTE',
    // Deposit Details
    depositAmountPaise: 350000000, // ₹ 35,00,000 (35 Lakhs in Paise)
    currency: 'INR',
    depositDate: '2024-08-15',
    maturityDate: formatDate(400), // ~13 months in future (ACTIVE)
    interestRate: 7.1,
    depositType: 'Fixed Deposit (Cumulative)',
    applicableSecurityRequirement: 'Technical Undergraduate Program Affiliation Security Deposit',
    remarks: 'Joint lien clause endorsed per AICTE handbook standard format.',
    // Document References
    documentId: 'doc-demo-01',
    fileName: 'COEP_SBI_FDR_Receipt_35L.pdf',
    fileType: 'application/pdf',
    fileSize: 1420500,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploadedAt: '2026-08-20T10:10:00.000Z',
    // Lifecycle
    status: 'REVIEW_ACCEPTED',
    assignedOfficerId: 'usr-demo-officer-01',
    reviewNotes: 'Verified against AICTE lien registry. Mandatory joint clause confirmed with SBI Shivajinagar branch.',
    clarificationReason: null,
    reviewedAt: '2026-08-22T14:30:00.000Z',
    lastStatusChangeAt: '2026-08-22T14:30:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-02',
    referenceNumber: 'FDR-2026-0002',
    institutionId: 'inst-demo-01', // College of Engineering & Technology Pune
    submittedBy: 'usr-demo-inst-01',
    createdAt: '2026-10-21T09:30:00.000Z',
    updatedAt: '2026-10-21T09:45:00.000Z',
    submittedAt: '2026-10-21T09:45:00.000Z',
    // Bank Details
    bankName: 'Bank of Baroda',
    branchName: 'Deccan Gymkhana Branch, Pune',
    branchAddress: 'Jangali Maharaj Road, Deccan Gymkhana, Pune - 411004',
    ifsc: 'BARB0DECCAN',
    fdrNumber: 'BOB-FDR-5541290',
    accountHolderName: 'Principal, COEP Jointly with Regional Officer, AICTE',
    // Deposit Details
    depositAmountPaise: 150000000, // ₹ 15,00,000
    currency: 'INR',
    depositDate: '2025-01-10',
    maturityDate: formatDate(650),
    interestRate: 6.85,
    depositType: 'Fixed Deposit (Non-Cumulative)',
    applicableSecurityRequirement: 'Postgraduate Program Expansion Security Deposit',
    remarks: 'Auto-renewal clause included upon maturity.',
    // Document References
    documentId: 'doc-demo-02',
    fileName: 'BOB_Deposit_Receipt_15Lakh.pdf',
    fileType: 'application/pdf',
    fileSize: 980200,
    sha256Hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    uploadedAt: '2026-10-21T09:40:00.000Z',
    // Lifecycle
    status: 'SUBMITTED',
    assignedOfficerId: null,
    reviewNotes: null,
    clarificationReason: null,
    reviewedAt: null,
    lastStatusChangeAt: '2026-10-21T09:45:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-03',
    referenceNumber: 'FDR-2026-0003',
    institutionId: 'inst-demo-03', // Saraswati College of Pharmacy Bhopal
    submittedBy: 'usr-inst-pharm-01',
    createdAt: '2026-10-18T11:00:00.000Z',
    updatedAt: '2026-10-20T16:00:00.000Z',
    submittedAt: '2026-10-18T11:20:00.000Z',
    // Bank Details
    bankName: 'Punjab National Bank',
    branchName: 'TT Nagar Main Branch, Bhopal',
    branchAddress: 'Apex Mall Complex, New Market, Bhopal - 462003',
    ifsc: 'PUNB0005500',
    fdrNumber: 'PNB-BHO-884129',
    accountHolderName: 'Secretary, Saraswati Education Trust Jointly with RO, AICTE',
    // Deposit Details
    depositAmountPaise: 250000000, // ₹ 25,00,000
    currency: 'INR',
    depositDate: '2024-11-01',
    maturityDate: formatDate(350),
    interestRate: 7.25,
    depositType: 'Special Fixed Deposit',
    applicableSecurityRequirement: 'B.Pharm Program New Course Security Deposit',
    remarks: 'Original bank lien letter submitted to Regional Office.',
    // Document References
    documentId: 'doc-demo-03',
    fileName: 'PNB_SecurityDeposit_25Lakhs.pdf',
    fileType: 'application/pdf',
    fileSize: 1250300,
    sha256Hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    uploadedAt: '2026-10-18T11:15:00.000Z',
    // Lifecycle
    status: 'UNDER_REVIEW',
    assignedOfficerId: 'usr-demo-officer-01',
    reviewNotes: 'Initial scrutiny begun by Western Regional Bureau. Evaluating lien format with PNB branch.',
    clarificationReason: null,
    reviewedAt: null,
    lastStatusChangeAt: '2026-10-20T16:00:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-04',
    referenceNumber: 'FDR-2026-0004',
    institutionId: 'inst-demo-02', // Sardar Patel College of Engineering Mumbai
    submittedBy: 'usr-inst-spce-01',
    createdAt: '2026-10-15T14:00:00.000Z',
    updatedAt: '2026-10-19T10:15:00.000Z',
    submittedAt: '2026-10-15T14:30:00.000Z',
    // Bank Details
    bankName: 'HDFC Bank',
    branchName: 'Andheri West Versova Branch, Mumbai',
    branchAddress: 'JP Road, Andheri West, Mumbai, Maharashtra - 400058',
    ifsc: 'HDFC0000240',
    fdrNumber: 'HDFC-MUM-99120',
    accountHolderName: 'Principal, SPCE Mumbai Jointly with AICTE',
    // Deposit Details
    depositAmountPaise: 200000000, // ₹ 20,00,000
    currency: 'INR',
    depositDate: '2023-06-15',
    maturityDate: formatDate(180),
    interestRate: 7.0,
    depositType: 'Term Deposit',
    applicableSecurityRequirement: 'Existing Technical Institute Security Deposit',
    remarks: 'Submitted for annual compliance renewal verification.',
    // Document References
    documentId: 'doc-demo-04',
    fileName: 'HDFC_Deposit_Receipt_Scan.pdf',
    fileType: 'application/pdf',
    fileSize: 840500,
    sha256Hash: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
    uploadedAt: '2026-10-15T14:20:00.000Z',
    // Lifecycle
    status: 'CLARIFICATION_REQUIRED',
    assignedOfficerId: 'usr-demo-officer-01',
    reviewNotes: 'Scrutiny Officer noticed missing joint signature seal on the reverse side of FDR certificate.',
    clarificationReason: 'The uploaded FDR certificate scan does not clearly display the bank branch manager seal and signature on the joint endorsement clause. Please re-scan with official bank counter-signature.',
    reviewedAt: '2026-10-19T10:15:00.000Z',
    lastStatusChangeAt: '2026-10-19T10:15:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-05',
    referenceNumber: 'FDR-2026-0005',
    institutionId: 'inst-demo-04', // National Polytechnic Ahmedabad
    submittedBy: 'usr-inst-poly-01',
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
    submittedAt: '2026-10-05T09:30:00.000Z',
    // Bank Details
    bankName: 'Canara Bank',
    branchName: 'Navrangpura Commercial Branch, Ahmedabad',
    branchAddress: 'C.G. Road, Navrangpura, Ahmedabad - 380009',
    ifsc: 'CNRB0002140',
    fdrNumber: 'CNRB-AHM-12004',
    accountHolderName: 'Registrar, National Polytechnic Jointly with Regional Officer',
    // Deposit Details
    depositAmountPaise: 100000000, // ₹ 10,00,000
    currency: 'INR',
    depositDate: '2025-01-01',
    maturityDate: '2026-01-01',
    interestRate: 6.5,
    depositType: 'Short Term Deposit',
    applicableSecurityRequirement: 'Diploma Intake Extension Security Deposit',
    remarks: 'Deposit created for 1 year tenure.',
    // Document References
    documentId: 'doc-demo-05',
    fileName: 'Canara_ShortTerm_FDR.pdf',
    fileType: 'application/pdf',
    fileSize: 620000,
    sha256Hash: '01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b',
    uploadedAt: '2026-10-05T09:25:00.000Z',
    // Lifecycle
    status: 'REVIEW_REJECTED',
    assignedOfficerId: 'usr-demo-officer-01',
    reviewNotes: 'Rejected due to regulatory non-compliance regarding mandatory minimum tenure.',
    clarificationReason: 'Tenure deficit: The submitted Fixed Deposit has a tenure of only 12 months. AICTE Approval Process Handbook mandates a minimum security deposit tenure of 5 to 10 years depending on institutional category.',
    reviewedAt: '2026-10-10T12:00:00.000Z',
    lastStatusChangeAt: '2026-10-10T12:00:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-06',
    referenceNumber: 'FDR-2026-0006',
    institutionId: 'inst-demo-01', // College of Engineering & Technology Pune
    submittedBy: 'usr-demo-inst-01',
    createdAt: '2025-05-10T08:00:00.000Z',
    updatedAt: '2025-05-14T11:00:00.000Z',
    submittedAt: '2025-05-10T08:30:00.000Z',
    // Bank Details
    bankName: 'State Bank of India',
    branchName: 'Shivajinagar Commercial Branch, Pune',
    branchAddress: 'F.C. Road, Shivajinagar, Pune, Maharashtra - 411004',
    ifsc: 'SBIN0001110',
    fdrNumber: 'SBI-FDR-8812903',
    accountHolderName: 'Principal, COEP Jointly with RO, AICTE',
    // Deposit Details
    depositAmountPaise: 500000000, // ₹ 50,00,000 (50 Lakhs)
    currency: 'INR',
    depositDate: '2023-11-20',
    maturityDate: formatDate(45), // Matures in ~45 days (APPROACHING MATURITY)
    interestRate: 7.3,
    depositType: 'Fixed Deposit (Cumulative)',
    applicableSecurityRequirement: 'Autonomous Technical Institute Institutional Corpus Security Deposit',
    remarks: 'Expiring in under 60 days. Renewal advisory dispatched.',
    // Document References
    documentId: 'doc-demo-06',
    fileName: 'SBI_Autonomous_Corpus_FDR_50L.pdf',
    fileType: 'application/pdf',
    fileSize: 1850000,
    sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    uploadedAt: '2025-05-10T08:25:00.000Z',
    // Lifecycle
    status: 'REVIEW_ACCEPTED',
    assignedOfficerId: 'usr-demo-officer-01',
    reviewNotes: 'Formally accepted during 2025 regional cycle. Re-verification scheduled upon maturity.',
    clarificationReason: null,
    reviewedAt: '2025-05-14T11:00:00.000Z',
    lastStatusChangeAt: '2025-05-14T11:00:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-07',
    referenceNumber: 'FDR-2026-0007',
    institutionId: 'inst-demo-01', // College of Engineering & Technology Pune
    submittedBy: 'usr-demo-inst-01',
    createdAt: '2024-04-10T10:00:00.000Z',
    updatedAt: '2024-04-15T15:00:00.000Z',
    submittedAt: '2024-04-10T10:30:00.000Z',
    // Bank Details
    bankName: 'Union Bank of India',
    branchName: 'Camp Main Branch, Pune',
    branchAddress: 'East Street, Camp, Pune, Maharashtra - 411001',
    ifsc: 'UBIN0532140',
    fdrNumber: 'UBI-PUN-334120',
    accountHolderName: 'Principal, COEP Jointly with Regional Officer, AICTE',
    // Deposit Details
    depositAmountPaise: 300000000, // ₹ 30,00,000 (30 Lakhs)
    currency: 'INR',
    depositDate: '2021-10-01',
    maturityDate: formatDate(-20), // Matured 20 days ago (MATURED)
    interestRate: 6.9,
    depositType: 'Special Fixed Deposit',
    applicableSecurityRequirement: 'Postgraduate Program Special Security Deposit',
    remarks: 'Deposit has matured. Ready for renewal initiation.',
    // Document References
    documentId: 'doc-demo-07',
    fileName: 'UBI_Deposit_Receipt_30L.pdf',
    fileType: 'application/pdf',
    fileSize: 1120000,
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    uploadedAt: '2024-04-10T10:25:00.000Z',
    // Lifecycle
    status: 'REVIEW_ACCEPTED',
    assignedOfficerId: 'usr-demo-officer-01',
    reviewNotes: 'Original certificate verified. Ready for digital renewal rollover.',
    clarificationReason: null,
    reviewedAt: '2024-04-15T15:00:00.000Z',
    lastStatusChangeAt: '2024-04-15T15:00:00.000Z',
    renewalReferenceId: null,
  },
  {
    id: 'fdr-demo-08',
    referenceNumber: 'FDR-2026-0008-DRAFT',
    institutionId: 'inst-demo-01', // College of Engineering & Technology Pune
    submittedBy: 'usr-demo-inst-01',
    createdAt: '2026-10-22T16:00:00.000Z',
    updatedAt: '2026-10-22T16:45:00.000Z',
    submittedAt: null,
    // Bank Details
    bankName: 'ICICI Bank',
    branchName: 'Bhandarkar Road Branch, Pune',
    branchAddress: 'Pyramid Mall, Bhandarkar Road, Pune - 411004',
    ifsc: 'ICIC0000005',
    fdrNumber: 'ICICI-FDR-77881',
    accountHolderName: 'Principal, COEP Jointly with AICTE',
    // Deposit Details
    depositAmountPaise: 180000000, // ₹ 18,00,000
    currency: 'INR',
    depositDate: '2026-10-20',
    maturityDate: formatDate(1825), // 5 years
    interestRate: 7.2,
    depositType: 'Fixed Deposit (Cumulative)',
    applicableSecurityRequirement: 'M.Tech AI & Data Science Program Sanction',
    remarks: 'Draft awaiting scanned PDF endorsement upload.',
    // Document References
    documentId: null,
    fileName: null,
    fileType: null,
    fileSize: 0,
    sha256Hash: null,
    uploadedAt: null,
    // Lifecycle
    status: 'DRAFT',
    assignedOfficerId: null,
    reviewNotes: null,
    clarificationReason: null,
    reviewedAt: null,
    lastStatusChangeAt: '2026-10-22T16:00:00.000Z',
    renewalReferenceId: null,
  },
];

export const DEMO_FDR_EVENTS = [
  {
    id: 'fev-001',
    fdrId: 'fdr-demo-01',
    previousStatus: 'DRAFT',
    newStatus: 'SUBMITTED',
    actorId: 'usr-demo-inst-01',
    actorRole: 'institution',
    actorName: 'Dr. Rajeshwar Patil',
    reason: null,
    notes: 'Initial formal submission with SBI deposit receipt and joint endorsement letter.',
    timestamp: '2026-08-20T10:15:00.000Z',
  },
  {
    id: 'fev-002',
    fdrId: 'fdr-demo-01',
    previousStatus: 'SUBMITTED',
    newStatus: 'UNDER_REVIEW',
    actorId: 'usr-demo-officer-01',
    actorRole: 'officer',
    actorName: 'Smt. Ananya Deshmukh',
    reason: null,
    notes: 'Scrutiny initiated. Checking mandatory lien clauses and branch code.',
    timestamp: '2026-08-21T11:00:00.000Z',
  },
  {
    id: 'fev-003',
    fdrId: 'fdr-demo-01',
    previousStatus: 'UNDER_REVIEW',
    newStatus: 'REVIEW_ACCEPTED',
    actorId: 'usr-demo-officer-01',
    actorRole: 'officer',
    actorName: 'Smt. Ananya Deshmukh',
    reason: null,
    notes: 'Administrative scrutiny verified. Mandated ₹35,00,000 security deposit accepted.',
    timestamp: '2026-08-22T14:30:00.000Z',
  },
  {
    id: 'fev-004',
    fdrId: 'fdr-demo-04',
    previousStatus: 'UNDER_REVIEW',
    newStatus: 'CLARIFICATION_REQUIRED',
    actorId: 'usr-demo-officer-01',
    actorRole: 'officer',
    actorName: 'Smt. Ananya Deshmukh',
    reason: 'The uploaded FDR certificate scan does not clearly display the bank branch manager seal and signature on the joint endorsement clause. Please re-scan with official bank counter-signature.',
    notes: 'Clarification notice generated to institution nodal officer.',
    timestamp: '2026-10-19T10:15:00.000Z',
  },
];
