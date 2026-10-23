/**
 * NidhiSetu Banking Simulator — Scenario Fixtures & Synthetic Bank Ledgers
 * Provides deterministic simulation fixtures and an independent synthetic bank ledger.
 *
 * NOTE: STRICTLY A SYNTHETIC SIMULATION REPOSITORY.
 * Values are mock data engineered for officer scrutiny demonstration and training.
 * All records include simulation flags and are not actual bank ledger records.
 */

export const SIMULATION_SCENARIOS = {
  EXACT_MATCH: {
    id: 'SCENARIO_A_EXACT_MATCH',
    code: 'A',
    title: 'Scenario A — Exact Match',
    description: 'FDR reference exists in synthetic bank ledger with matching principal amount, dates, account holder, and confirmed regulatory lien.',
    expectedOutcome: 'MATCH',
    depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    tags: ['Optimal Path', 'Consistent', 'Lien Confirmed'],
  },
  AMOUNT_MISMATCH: {
    id: 'SCENARIO_B_AMOUNT_MISMATCH',
    code: 'B',
    title: 'Scenario B — Deposit Amount Mismatch',
    description: 'FDR exists in synthetic bank ledger, but ledger principal amount differs from the amount declared in the institution submission.',
    expectedOutcome: 'MISMATCH',
    depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    tags: ['Discrepancy', 'Amount Mismatch', 'Requires Investigation'],
  },
  FDR_NOT_FOUND: {
    id: 'SCENARIO_C_FDR_NOT_FOUND',
    code: 'C',
    title: 'Scenario C — FDR Not Found in Synthetic Ledger',
    description: 'No matching deposit record exists in the issuing bank synthetic ledger under the submitted FDR instrument number.',
    expectedOutcome: 'MISMATCH',
    depositExistenceStatus: 'NOT_FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'UNKNOWN',
    tags: ['Critical Discrepancy', 'Instrument Not Found'],
  },
  LIEN_NOT_RECORDED: {
    id: 'SCENARIO_D_LIEN_NOT_RECORDED',
    code: 'D',
    title: 'Scenario D — Lien Not Recorded in Bank Records',
    description: 'Deposit account exists with matching financial terms, but the issuing bank ledger has no lien recorded in favor of AICTE/Regulatory Authority.',
    expectedOutcome: 'MISMATCH',
    depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'LIEN_NOT_RECORDED_IN_SIMULATION',
    tags: ['Lien Missing', 'Unsecured Deposit', 'Action Required'],
  },
  LIEN_BENEFICIARY_MISMATCH: {
    id: 'SCENARIO_E_BENEFICIARY_MISMATCH',
    code: 'E',
    title: 'Scenario E — Lien Beneficiary Mismatch',
    description: 'Lien is recorded in the synthetic bank ledger, but the beneficiary is noted as a third party or local entity instead of the required regulatory authority.',
    expectedOutcome: 'MISMATCH',
    depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'BENEFICIARY_MISMATCH_IN_SIMULATION',
    tags: ['Beneficiary Discrepancy', 'Lien Defect'],
  },
  MATURITY_MISMATCH: {
    id: 'SCENARIO_F_MATURITY_MISMATCH',
    code: 'F',
    title: 'Scenario F — Maturity Date Mismatch',
    description: 'Synthetic bank records report a maturity date significantly shorter or conflicting with the institution submission.',
    expectedOutcome: 'MISMATCH',
    depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    tags: ['Tenure Discrepancy', 'Maturity Mismatch'],
  },
  EXPIRED_DEPOSIT: {
    id: 'SCENARIO_G_EXPIRED_DEPOSIT',
    code: 'G',
    title: 'Scenario G — Expired / Matured Deposit',
    description: 'Deposit instrument found in synthetic ledger has already passed its maturity date or was liquidated.',
    expectedOutcome: 'MISMATCH',
    depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    tags: ['Matured / Expired', 'Liquidation Risk'],
  },
  TIMEOUT: {
    id: 'SCENARIO_H_TIMEOUT',
    code: 'H',
    title: 'Scenario H — Bank Response Timeout',
    description: 'Simulates network or core-banking response timeout where synthetic bank node does not acknowledge confirmation within simulation window.',
    expectedOutcome: 'FAILURE',
    depositExistenceStatus: 'INDETERMINATE',
    lienStatus: 'UNKNOWN',
    tags: ['Timeout', 'Network Latency', 'Retry Permitted'],
  },
  MALFORMED_RESPONSE: {
    id: 'SCENARIO_I_MALFORMED_RESPONSE',
    code: 'I',
    title: 'Scenario I — Malformed Response Payload',
    description: 'Simulates receiving an unparseable or schema-violating financial message payload that fails client-side message schema validation.',
    expectedOutcome: 'FAILURE',
    depositExistenceStatus: 'INDETERMINATE',
    lienStatus: 'UNKNOWN',
    tags: ['Schema Failure', 'Malformed Message', 'Validation Error'],
  },
  DUPLICATE_REQUEST: {
    id: 'SCENARIO_J_DUPLICATE_REQUEST',
    code: 'J',
    title: 'Scenario J — Duplicate Verification Request',
    description: 'Detects concurrent or repeated verification requests for the same FDR instrument within the active verification window.',
    expectedOutcome: 'BLOCKED_DUPLICATE',
    depositExistenceStatus: 'INDETERMINATE',
    lienStatus: 'UNKNOWN',
    tags: ['Idempotency Check', 'Duplicate Blocked'],
  },
};

/**
 * Independent Synthetic Bank Ledgers
 * These records represent the independent state stored on mock bank ledger cores.
 * They are intentionally distinct from user submissions to ensure realistic verification.
 */
export const SYNTHETIC_BANK_LEDGER_FIXTURES = [
  {
    syntheticLedgerId: 'LEDGER-SBI-9812401',
    simulatorBankId: 'sim-bank-sbi',
    bankCode: 'SBIN',
    bankName: 'State Bank of India',
    fdrNumber: 'SBI-FDR-9812401',
    accountHolder: 'Principal, COEP Jointly with RO, AICTE',
    principalAmountPaise: 350000000, // ₹ 35,00,000 Exact Match
    depositDate: '2024-08-15',
    maturityDate: '2027-09-17',
    interestRate: 7.1,
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    lienBeneficiary: 'Regional Officer, AICTE Western Regional Office, Mumbai',
    lienReference: 'LIEN-REF/SBIN/2024/09812',
    lienMarkedDate: '2024-08-16',
    ledgerStatus: 'ACTIVE',
    branchIfsc: 'SBIN0001110',
    simulationFlag: true,
  },
  {
    syntheticLedgerId: 'LEDGER-BOB-5541290',
    simulatorBankId: 'sim-bank-bob',
    bankCode: 'BARB',
    bankName: 'Bank of Baroda',
    fdrNumber: 'BOB-FDR-5541290',
    accountHolder: 'Principal, COEP Jointly with Regional Officer, AICTE',
    principalAmountPaise: 150000000, // ₹ 15,00,000 (Submitted is 25,00,000 -> Amount Mismatch)
    depositDate: '2024-10-10',
    maturityDate: '2026-10-10',
    interestRate: 6.85,
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    lienBeneficiary: 'Regional Officer, AICTE Western Regional Office',
    lienReference: 'LIEN-REF/BARB/2024/05541',
    lienMarkedDate: '2024-10-11',
    ledgerStatus: 'ACTIVE',
    branchIfsc: 'BARB0DECCAN',
    simulationFlag: true,
  },
  {
    syntheticLedgerId: 'LEDGER-PNB-7721834',
    simulatorBankId: 'sim-bank-pnb',
    bankCode: 'PUNB',
    bankName: 'Punjab National Bank',
    fdrNumber: 'PNB-FDR-7721834',
    accountHolder: 'Director, MIT Pune',
    principalAmountPaise: 500000000, // ₹ 50,00,000
    depositDate: '2024-05-01',
    maturityDate: '2027-05-01',
    interestRate: 7.25,
    lienStatus: 'LIEN_NOT_RECORDED_IN_SIMULATION', // No lien recorded
    lienBeneficiary: null,
    lienReference: null,
    lienMarkedDate: null,
    ledgerStatus: 'ACTIVE',
    branchIfsc: 'PUNB0123400',
    simulationFlag: true,
  },
  {
    syntheticLedgerId: 'LEDGER-CANARA-3319021',
    simulatorBankId: 'sim-bank-canara',
    bankCode: 'CNRB',
    bankName: 'Canara Bank',
    fdrNumber: 'CNRB-FDR-3319021',
    accountHolder: 'Dean, Walchand College of Engg Sangli',
    principalAmountPaise: 180000000, // ₹ 18,00,000
    depositDate: '2023-11-20',
    maturityDate: '2026-11-20',
    interestRate: 7.0,
    lienStatus: 'BENEFICIARY_MISMATCH_IN_SIMULATION',
    lienBeneficiary: 'Department of Higher & Technical Education, Maharashtra', // Mismatched beneficiary
    lienReference: 'LIEN-REF/CNRB/2023/03319',
    lienMarkedDate: '2023-11-21',
    ledgerStatus: 'ACTIVE',
    branchIfsc: 'CNRB0002100',
    simulationFlag: true,
  },
  {
    syntheticLedgerId: 'LEDGER-HDFC-9901412',
    simulatorBankId: 'sim-bank-hdfc',
    bankCode: 'HDFC',
    bankName: 'HDFC Bank',
    fdrNumber: 'HDFC-FDR-9901412',
    accountHolder: 'Trustee, VJTI Mumbai Jointly with AICTE',
    principalAmountPaise: 250000000, // ₹ 25,00,000
    depositDate: '2023-01-10',
    maturityDate: '2025-01-10', // Already expired/matured
    interestRate: 7.0,
    lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    lienBeneficiary: 'Member Secretary, AICTE New Delhi',
    lienReference: 'LIEN-REF/HDFC/2023/99014',
    lienMarkedDate: '2023-01-11',
    ledgerStatus: 'EXPIRED',
    branchIfsc: 'HDFC0000240',
    simulationFlag: true,
  },
];
