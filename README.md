# NidhiSetu (निधिसेतु)

### AI-Powered Security Deposit & Fixed Deposit Receipt (FDR) Management Platform
> **Tagline:** Bridging Trust, Securing Deposits.  
> **Smart India Hackathon (SIH) Prototype Demonstration Platform**

---

## Run locally

Use Node.js 24 or newer, or Node.js 22.13+. From the project directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).
`npm start` also starts the development server. Opening `index.html` directly
or using an HTML-only Live Server will not compile this React application.

No environment variables, API keys, database, or backend server are required.
Demo records initialize automatically in browser storage. Visit `/login` and
use **Auto-Fill Demo Account** to access the institution, officer, or admin portal.
Data is specific to the browser and origin; uploaded documents use IndexedDB.
This is a local prototype with simulated banking and browser-side authentication.

```sh
npm test          # Automated application tests
npm run lint      # Static checks (existing warnings are reported)
npm run build     # Create the production dist/ directory
npm run preview   # Serve the production build locally
```

Use localhost or HTTPS for document upload features that require Web Crypto.
PDF extraction uses a bundled worker. Image/scanned-PDF OCR requires internet
access on first use to download Tesseract's worker, engine, and language data;
Google Fonts also requires internet access. Production static hosting must
rewrite application routes to `index.html` so dashboard links work on refresh.

## Responsive display scale

The shared stylesheet (`src/index.css`) sets the default visual scale using
rem-based sizing, without CSS zoom or an application-wide transform:

| Viewport width | Default scale | Default root font size |
| --- | --- | --- |
| Below 768px | 100% | 16px |
| 768–1023px | 112.5% | 18px |
| 1024–1279px | 125% | 20px |
| 1280px and above | 150% | 24px |

The A− / A / A+ accessibility controls apply relative to this default. Reset
returns to the responsive default, not a forced 16px desktop size. Existing
saved text preferences still apply. Print uses normal sizing.

Tailwind layout breakpoints allow enlarged content to reflow: `sm` 640px,
`md` 864px, `lg` 1536px, `xl` 1920px, and `2xl` 2304px (at the browser's
default font size). Navigation uses a menu/drawer until enough space is
available. Wide tables retain their own horizontal scroll containers.

For new UI, use Tailwind's rem-based utilities or rem values rather than fixed
pixel text and dimensions. Keep viewport units for fullscreen overlays and
hairline borders in pixels. Modal overlays use `app-modal` to constrain their
panels to the viewport and keep long forms scrollable.

## 📌 Module Status Overview

- ✅ **Module 01: Government-Style Public Website & Design System** — Completed
- ✅ **Module 02: Authentication, Role-Based Access Control & Institutional Workspaces** — Completed
- ✅ **Module 03: FDR Submission, Document Management & Lifecycle Tracking** — Completed
- ✅ **Module 04: AI-Assisted Document Intelligence & Explainable Anomaly Detection** — Completed
- ✅ **Module 05: Simulated Bank Confirmation, SFMS/CBS Messaging & FDR Lien Verification** — Completed
- ✅ **Module 06: Regulatory Compliance Intelligence, Deposit Adequacy & Risk Monitoring** — Completed
- ✅ **Module 07: Smart FDR Renewal, Deposit Continuity & Simulated Lien Release Management** — Completed
- ✅ **Module 08: Unified Regulatory Command Center, Portfolio Analytics & Explainable Case Prioritization** — Completed
- ⏳ **Module 09: Encashment Enforcement, Sovereign Claims & Appellate Tribunal Management** — Recommended Next Step


---

## 🎨 Design System & Palette

- **Primary Navy:** `#0B1F54`
- **Royal Blue:** `#174EA6`
- **Background:** `#F5F7FB`
- **Saffron Accent:** `#E89B24`
- **Success Green:** `#13805E`
- **Surface / Card White:** `#FFFFFF`
- **Border / Divider:** `#D3DDEB`
- **Typography:** Inter (Latin) & Noto Sans Devanagari (Devanagari script)
- **Aesthetic:** Clean Indian administrative portal styling, high-contrast borders, accessible focus outlines, responsive tables, official status badges, and restrained visual elevation.

---

## 🏛️ Module 02: Authentication, RBAC & Workspaces Architecture

Module 02 establishes a functional, zero-external-backend authentication and institutional workspace environment completely operated within browser `localStorage` and `sessionStorage`. All repository interfaces are structured asynchronously with Promises to simplify future REST / GraphQL backend migrations.

### 1. Storage Architecture (`src/storage/`)
- **`storageService.js`:** Versioned JSON storage wrapper (`STORAGE_VERSION = '1.0.0-PROTOTYPE'`), safe parsing with error recovery fallbacks, quota error management, and automated log pruning.
- **`demoData.js`:** Deterministic synthetic seed data for institution, officer, and administrator accounts, plus pre-registered sample institutions.
- **`migrations.js`:** Idempotent storage initialization that guarantees baseline records without overwriting user-created onboarding entries, plus a scoped demo reset utility.
- **`authRepository.js`:** Simulated credential checks, role matching, last login timestamping, and session generation.
- **`sessionRepository.js`:** Dual-storage session manager (`sessionStorage` for tab-only sessions, `localStorage` for remembered sessions) with expiration simulation.
- **`userRepository.js`:** User lifecycle CRUD with strict safety restriction preventing deactivation of the last active administrator.
- **`institutionRepository.js`:** Institutional record retrieval, duplicate AISHE / email collision prevention, profile modification, and summary updates.
- **`notificationRepository.js`:** Multi-role event notification stream with read/unread tracking and individual or bulk mark-as-read operations.
- **`auditRepository.js`:** Chronological traceability logger recording `DEMO_LOGIN`, `DEMO_LOGOUT`, `PROFILE_UPDATED`, `INSTITUTION_REGISTERED`, `USER_STATUS_CHANGED`, and `DEMO_DATA_RESET`.

### 2. Versioned Storage Keys
- `nidhisetu_users_v1`: Master user credentials and profile records.
- `nidhisetu_institutions_v1`: Directory of registered institutions and deposit summaries.
- `nidhisetu_session_v1`: Active authentication token and user identity.
- `nidhisetu_audit_logs_v1`: Traceability audit events (client-side simulation).
- `nidhisetu_notifications_v1`: Role-specific and targeted system notices.
- `nidhisetu_demo_metadata_v1`: Storage schema versioning and seed timestamps.
- `nidhisetu_reg_draft_v1`: Real-time onboarding draft persistence.

---

## 👥 Demo User Accounts for Evaluation

Instant access is available directly from the **`/login`** page by clicking the **"Auto-Fill Demo Account"** button on each respective role tab:

| Portal Role | Demo Email | Access Code | Default Dashboard | Permissions |
|-------------|------------|-------------|-------------------|-------------|
| **Educational Institution** | `principal@coep-pune.demo` | `demo@123` | `/institution/dashboard` | Manage college profile, view applications, inspect deposit repository placeholders, account security. |
| **AICTE Scrutiny Officer** | `scrutiny.west@aicte.demo` | `officer@123` | `/officer/dashboard` | Scrutiny console, inspect institutional registry, preview verification queue, track cases and audit history. |
| **System Administrator** | `sysadmin@nidhisetu.demo` | `admin@123` | `/admin/dashboard` | System overview, activate/deactivate user accounts, audit stream, platform governance & scoped demo reset. |

---

## 📋 5-Step Institution Onboarding Workflow (`/register`)

The registration system has been implemented as a multi-step onboarding wizard:
1. **Step 1 — Institutional Legal Identity:** Statutory name, AICTE Permanent Institute ID, AISHE code (with duplicate validation), state, district, city, PIN code, and campus address. Includes an **"Auto-Fill Demo Data"** button for instant evaluation.
2. **Step 2 — Authorized Representative:** Signatory full name, designation, official email (with duplicate account check), and mobile contact.
3. **Step 3 — Regulatory Info:** Self-declared AICTE approval status, institutional category, year of establishment, and regulatory compliance affirmation.
4. **Step 4 — Review Dossier:** Structured review card presenting all entered data with real-time editing capability.
5. **Step 5 — Confirmation:** Unique institutional reference generation (`REG-ST-XXXX`), automatic user account provisioning, welcome notification creation, audit logging, and direct 1-click access to the new institution workspace.

---

## 🗺️ Application Routes

### Public Website (Module 01)
| Route | Description |
|-------|-------------|
| `/` | NidhiSetu Public Portal Homepage (All 9 government-style sections) |
| `/about` | Mandate, mission, vision, and regulatory context |
| `/services` | Service blueprints + Interactive ARN Status Lookup Simulator |
| `/how-it-works` | 6-stage lifecycle walkthrough & bank protocol |
| `/faq` | Full knowledge base with live search and category filters |
| `/contact` | Institutional inquiry & grievance redressal |
| `/privacy` | Privacy policy & data handling principles |
| `/terms` | Institutional terms of use & legal covenants |
| `/accessibility` | Accessibility statement (WCAG 2.1 AA & GIGW guidelines) |
| `/unauthorized` | Accessible restricted access warning page |
| `*` | Custom 404 Not Found error page |

### Authentication & Onboarding (Module 02)
| Route | Description |
|-------|-------------|
| `/login` | Enhanced role-based login with auto-fill demo credentials, show/hide password, and reloadable captcha |
| `/register` | 5-step institutional onboarding engine with draft auto-save and validation |

### Educational Institution Portal (`/institution/*`)
| Route | Description |
|-------|-------------|
| `/institution/dashboard` | Executive summary cards, profile card, recent activity trail, quick actions, Module 03 preview |
| `/institution/profile` | Editable institutional contacts, campus address, read-only statutory identifiers, unsaved changes warnings |
| `/institution/applications` | Active submission list with ARN status tracking |
| `/institution/fdr-records` | Institutional FDR repository overview with informative Module 03 empty state |
| `/institution/notifications` | Notification center with category filtering and read/unread status management |
| `/institution/settings` | Demo access code changer, telemetry info, and session expiration diagnostics |

### AICTE Scrutiny Officer Portal (`/officer/*`)
| Route | Description |
|-------|-------------|
| `/officer/dashboard` | Scrutiny console overview, regional statistics, jurisdiction institutions table, audit stream |
| `/officer/institutions` | Comprehensive institutional registry with search, state filters, and detailed inspection modal |
| `/officer/verification-queue` | Pending verification review queue docket (Module 03 preview) |
| `/officer/cases` | Assigned scrutiny dockets and statutory compliance deadlines |
| `/officer/activity` | Chronological scrutiny audit log stream |
| `/officer/fdr/:id` | **(Module 03)** Officer scrutiny cockpit with completeness checklist and review actions |

### System Administrator Portal (`/admin/*`)
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Master platform telemetry, storage metrics, self-reported deposit aggregates, and user distribution |
| `/admin/users` | User account table with activate/deactivate action and last active admin safety guard |
| `/admin/institutions` | Complete national institutional directory with search, deposit metrics, and status badges |
| `/admin/audit-logs` | Tamper-evident audit event log stream with action filters |
| `/admin/settings` | Storage engine diagnostics, session management, and Scoped Demo Reset modal |

---

## 🏛️ Module 03: FDR Submission, Document Management & Lifecycle Tracking

Module 03 delivers a complete end-to-end institutional deposit workflow, deterministic state machine, browser-local IndexedDB document store, and regulatory scrutiny cockpit without relying on external backends.

### 1. Storage Architecture (`src/storage/`)
- **`fdrRepository.js`:** FDR record persistence, draft management, scrutiny queue querying, duplicate FDR warnings, renewal initiation, and real-time dashboard aggregates.
- **`fdrDocumentRepository.js`:** IndexedDB wrapper (`nidhisetu_documents_v1`, object store `documents`) for storing and retrieving PDF and image scans directly as Blobs with SHA-256 fingerprinting. Large binary blobs are never stored in `localStorage`. Includes automatic memory fallback and orphan scan cleanup.
- **`fdrLifecycleRepository.js`:** Deterministic state machine governing all 7 lifecycle statuses (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `CLARIFICATION_REQUIRED`, `RESUBMITTED`, `REVIEW_ACCEPTED`, `REVIEW_REJECTED`), enforcing role permissions, mandatory reasons, and appending immutable event records to `nidhisetu_fdr_events_v1`.
- **`fdrMaturityService.js`:** Calendar-date-safe calculation for days until maturity (`getDaysUntilMaturity`), maturity categorization (`ACTIVE`, `APPROACHING`, `MATURES_SOON`, `MATURED`), UI badges, and idempotent client-side notification triggers.
- **`fdrValidation.js`:** Official Indian Financial System Code (IFSC) regex validation (`^[A-Z]{4}0[A-Z0-9]{6}$`), decimal-safe integer paise conversions (`rupeesToPaise`, `paiseToRupees`, `formatINR`), date range validation, file format checks, and Web Crypto API SHA-256 fingerprint generation.
- **`fdrDemoData.js`:** Deterministic synthetic seed records (`fdr-demo-01` to `fdr-demo-08`) covering all lifecycle states and maturity ranges.

### 2. Versioned Storage Keys
- `nidhisetu_fdr_records_v1`: FDR metadata, financial values in paise, bank details, and reference IDs in `localStorage`.
- `nidhisetu_fdr_events_v1`: Immutable chronological lifecycle event audit stream in `localStorage`.
- `nidhisetu_fdr_drafts_v1`: Auto-saved institution-scoped draft submissions in `localStorage`.
- `nidhisetu_documents_v1`: Browser IndexedDB database storing uploaded document scans as raw Blobs.

### 3. FDR Data Model
Each record adheres to the standardized schema:
- **Identity:** `id`, `referenceNumber` (`FDR-YYYY-XXXX`), `institutionId`, `submittedBy`, `createdAt`, `updatedAt`, `submittedAt`
- **Bank Information:** `bankName`, `branchName`, `branchAddress`, `ifsc`, `fdrNumber`, `accountHolderName`
- **Deposit Information:** `depositAmountPaise` (authoritative integer paise), `currency` (`INR`), `depositDate`, `maturityDate`, `interestRate`, `depositType`, `applicableSecurityRequirement`, `remarks`
- **Document Reference:** `documentId`, `fileName`, `fileType`, `fileSize`, `sha256Hash`, `uploadedAt`
- **Lifecycle:** `status`, `assignedOfficerId`, `reviewNotes`, `clarificationReason`, `reviewedAt`, `lastStatusChangeAt`, `renewalReferenceId`

### 4. Deterministic Lifecycle State Machine
```
[DRAFT] ──────(Institution)─────► [SUBMITTED]
                                      │
                                  (Officer)
                                      ▼
                               [UNDER_REVIEW] ◄───(Officer)───┐
                                │     │     │                  │
                ┌───────────────┘     │     └────────────┐     │
                ▼                     ▼                  ▼     │
      [CLARIFICATION_REQ]     [REVIEW_ACCEPTED]  [REVIEW_REJECTED]
                │
          (Institution)
                ▼
          [RESUBMITTED] ──────────────(Officer)───────────────┘
```

> **Administrative Disclaimer:** `REVIEW_ACCEPTED` indicates that an administrative scrutiny officer verified document completeness and regulatory compliance. It does not imply external real-time authentication by the issuing bank.

### 5. 6-Step Submission Wizard (`/institution/fdr/new`)
1. **Step 1 — Institution Info:** Auto-populated read-only institutional identity, AISHE code, authorized representative, and campus address. Cross-institution submissions are strictly blocked.
2. **Step 2 — Bank Details:** Bank name, branch name, address, 11-char IFSC format check, FDR certificate number, duplicate FDR warning, and joint account holder name.
3. **Step 3 — Deposit Financials:** Positive deposit amount in INR (with live formatted preview), issue date, maturity date (must be strictly after deposit date), annual interest rate, and statutory requirement.
4. **Step 4 — Document Upload:** Drag-and-drop or file browser supporting PDF, JPEG, PNG, and WebP (up to 10MB). Computes SHA-256 fingerprint using the Web Crypto API, saves blob to IndexedDB, and enables modal preview.
5. **Step 5 — Review & Affirmation:** Comprehensive structured dossier review, validation check strip, and statutory declaration affirmation checkbox.
6. **Step 6 — Confirmation:** Unique FDR Reference Number generation (`FDR-YYYY-XXXX`), audit logging, notification dispatch, and direct link to repository.

Includes an **"Auto-Fill Test FDR"** helper button for instant 1-click evaluation.

---

## 🧪 Automated Test Suite (Vitest + React Testing Library)

NidhiSetu includes a comprehensive automated test suite covering all 45 automated test points:
- **Module 02 Test Suite (`module02.test.jsx`):** 18 passing tests covering authentication, session handling, RBAC route protection, institution profile updates, and Module 01 regression.
- **Module 03 Test Suite (`module03.test.jsx`):** 27 passing tests covering:
  1. FDR draft creation
  2. Draft persistence
  3. Draft deletion
  4. Institution ownership checks
  5. Valid FDR submission with stable reference
  6. Invalid IFSC format rejection
  7. Invalid maturity date rejection
  8. Duplicate FDR warning
  9. File type validation (PDF, JPG, PNG, WebP)
  10. File size limitation enforcement (10 MB limit)
  11. SHA-256 fingerprint generation
  12. IndexedDB document persistence & retrieval
  13. Document preview URL generation & safe revocation
  14. Corrupted storage recovery
  15. Valid lifecycle state machine transitions
  16. Invalid lifecycle state machine transitions
  17. Officer review actions
  18. Clarification workflow with mandatory reasons
  19. In-app notification generation
  20. Audit event generation
  21. Calendar-date-safe maturity calculations
  22. Renewal linking and draft creation
  23. Dashboard statistic accuracy
  24. Multilingual dictionary coverage (EN, HI, MR)
  25. Protected route redirection
  26. Module 01 & 02 regression
  27. Complete end-to-end integration workflow (Submit -> Review -> Clarify -> Resubmit -> Accept)

---

## 🧠 Module 04: AI-Assisted Document Intelligence & Explainable Anomaly Detection

Module 04 introduces a fully browser-local OCR entity extraction, cross-field verification, exact duplicate detection, and human scrutiny review engine. Zero document images or extracted text strings are transmitted to external cloud APIs or remote servers.

### 1. Document Intelligence Engine (`src/intelligence/`)
- **`ocrEngine.js`:** Unified client-side document processor integrating `pdfjs-dist` for native text layer parsing and `tesseract.js` for scanned document OCR. Dynamically loaded with cancellation (`AbortController`), progress callback streams, and automatic memory cleanup.
- **`pdfTextExtractor.js`:** Native digital text layer extractor preferring vector strings and falling back to offscreen canvas rasterization when pages lack embedded text.
- **`fieldNormalizer.js`:** Decimal-safe currency normalizer (strict integer paise via `rupeesToPaise`), ISO date converter (`YYYY-MM-DD` from various Indian/textual formats), canonical bank alias dictionary (`SBI` -> `STATE BANK OF INDIA`), and standard 11-char IFSC cleaner.
- **`fdrFieldExtractor.js`:** Rule-based extraction engine with label proximity regexes, keyword detection, snippet generation, candidate ranking, and confidence heuristics.
- **`fieldComparator.js`:** Strict cross-field comparator evaluating extracted OCR values against portal-submitted metadata (`MATCH`, `MISMATCH`, `MISSING_IN_DOCUMENT`, `MISSING_IN_SUBMISSION`, `AMBIGUOUS`). Financial checks execute in integer paise.
- **`duplicateDetector.js`:** SHA-256 collision detector classifying matches into `INFORMATIONAL_DUPLICATE` (same draft), `CONTEXTUAL_RENEWAL` (historical renewal chain), `INTERNAL_DUPLICATE` (same institution), or `CROSS_INSTITUTION_COLLISION` (investigation signal).
- **`anomalyEngine.js`:** Deterministic, explainable finding generator producing structured discrepancy records with 4 severity levels (`INFO`, `LOW`, `MEDIUM`, `HIGH`) and recommended regulatory actions without false fraud accusations.
- **`analysisReportBuilder.js`:** Assembles the transparent 4-dimension scorecard and generates stable audit fingerprints.
- **`intelligenceDemoData.js`:** Pre-configured synthetic OCR fixtures and demo analysis loader for instant evaluation.

### 2. Versioned Storage Repositories
- **`documentAnalysisRepository.js` (`nidhisetu_document_analysis_v1`):** Stores analysis reports, preserves historical runs, queries by FDR or institution, and tracks document staleness when scans are replaced.
- **`intelligenceReviewRepository.js` (`nidhisetu_intelligence_reviews_v1`):** Manages human officer reviews, lifecycle transitions (`OPEN` -> `UNDER_REVIEW` -> `CONFIRMED_DISCREPANCY` / `DISMISSED` / `RESOLVED`), audit notes, and mandatory justification reasons (>= 5 characters). Module 03 administrative reviews remain strictly independent of Module 04 intelligence reviews.

### 3. Transparent 4-Dimension Scorecard
Rather than generating an unverified, misleading single "authenticity score", NidhiSetu presents a transparent breakdown:
1. **Extraction Completeness:** Formula-backed percentage of detected fields (e.g., `8 / 9 fields extracted (89%)`).
2. **Field Consistency:** Quantified matches vs discrepancies across critical fields.
3. **Duplicate Signals:** Explicit SHA-256 fingerprint collision status.
4. **Document Readability:** Word count, decipherability, and optical clarity indicator.

### 4. New Officer Intelligence Routes
| Route | Description |
|-------|-------------|
| `/officer/document-intelligence` | Central Scrutiny Workspace with KPI cards, multi-facet filtering (search, institution, severity, review state), and demo loader. |
| `/officer/document-intelligence/:fdrId` | Comprehensive Investigation Dossier with side-by-side comparison table, evidence snippets, duplicate collisions, and adjudication toolbar. |

### 5. Automated Test Suite (74 Total Tests Passing)
Module 04 adds 29 automated test cases covering:
- Text-based PDF extraction & scanned fallback
- Image OCR integration, cancellation & error handling
- IFSC, FDR number, deposit amount, date, and interest rate extraction
- Missing-field & multiple-candidate disambiguation
- Integer paise financial matching & discrepancy detection
- Cross-institution vs renewal-chain duplicate SHA-256 detection
- Stable finding fingerprints & document staleness tracking
- Officer review lifecycle, mandatory dismissal reasons & reopening
- Institution ownership boundaries & officer route guards
- Multilingual translation completeness (EN, HI, MR)
- Zero regression across Modules 01, 02, and 03

---

## 🏦 Module 05: Simulated Bank Confirmation, SFMS/CBS Messaging & FDR Lien Verification

Module 05 introduces an educational, fully browser-local **commercial bank confirmation simulation platform**. It demonstrates how regulatory scrutiny officers request independent confirmation of institutional FDR deposits and regulatory lien encumbrances directly from issuing scheduled commercial banks without establishing external network connections.

> **Strict Banking Simulation Disclaimer:**  
> **SIMULATED BANK RESPONSE — NOT A REAL BANK CONFIRMATION**  
> All banking interactions, message schemas, and ledger entries are synthetic demonstrations. No real bank APIs, SFMS/SWIFT networks, or live CBS integrations are executed.

### 1. Banking Simulation Architecture (`src/banking/`)
- **`bankRegistry.js`:** Synthetic commercial bank directory managing demonstration profiles (State Bank of India, Bank of Baroda, Punjab National Bank, Canara Bank, HDFC Bank, ICICI Bank) with simulated latencies, supported verification types, and scoped reset controls.
- **`bankMessageSchema.js`:** Formal schema specifications for internal mock financial messages (`MOCK_FDR_VERIFY_REQUEST`, `MOCK_FDR_VERIFY_RESPONSE`, `MOCK_LIEN_STATUS_REQUEST`, `MOCK_LIEN_STATUS_RESPONSE`) with client-side schema validation and mandatory simulation disclaimers.
- **`bankMessageBuilder.js`:** Factory service generating correlated request and confirmation response messages with correlation tracking IDs.
- **`bankScenarioFixtures.js`:** Deterministic demonstration scenarios (Scenarios A through J) and an **independent synthetic bank ledger** ensuring bank records are not merely echoed from institution submissions.
- **`bankSimulator.js`:** Deterministic simulation execution engine handling mock delays, scenario dispatch, CBS reference generation, and timeout modeling.
- **`bankFieldComparator.js`:** Authoritative side-by-side comparison engine executing strict financial matching in **integer paise** (`declaredAmountPaise` vs `bankReportedAmountPaise`) and normalized ISO dates (`MATCH`, `MISMATCH`, `MISSING_IN_BANK_RESPONSE`, `INDETERMINATE`).
- **`lienStatusEngine.js`:** Dedicated regulatory encumbrance engine verifying whether bank ledgers record an active lien in favor of the designated regulatory beneficiary (e.g., AICTE).
- **`verificationSummaryBuilder.js`:** Aggregates telemetry into an explainable verification verdict (`CONSISTENT_WITH_SIMULATION`, `DISCREPANCIES_DETECTED`, `INDETERMINATE`).

### 2. Supported Deterministic Scenarios (A through J)
1. **Scenario A — Exact Match:** Instrument located in synthetic ledger with matching principal amount, dates, account title, and confirmed regulatory lien.
2. **Scenario B — Deposit Amount Mismatch:** Instrument located, but synthetic ledger principal differs from institution submission.
3. **Scenario C — FDR Not Found:** No deposit record located in synthetic ledger under the submitted instrument number.
4. **Scenario D — Lien Not Recorded:** Deposit exists, but issuing bank reports no lien or encumbrance marked in favor of the regulatory authority.
5. **Scenario E — Lien Beneficiary Mismatch:** Lien exists, but registered in favor of an unauthorized third-party entity.
6. **Scenario F — Maturity Date Mismatch:** Bank simulator returns a conflicting or shortened maturity tenure.
7. **Scenario G — Expired / Matured Deposit:** Deposit maturity date has already elapsed in synthetic ledger.
8. **Scenario H — Bank Response Timeout:** Simulates core banking gateway timeout with no response received within simulation window.
9. **Scenario I — Malformed Response:** Simulates response payload failing internal schema validation.
10. **Scenario J — Duplicate Verification Request:** Blocks concurrent active verification inquiries on the same instrument.

### 3. Versioned Storage Repositories
- **`bankVerificationRepository.js` (`nidhisetu_bank_verifications_v1`):** Requests CRUD, deterministic request state machine (`DRAFT` -> `REQUESTED` -> `PROCESSING` -> `RESPONSE_RECEIVED` / `RESPONSE_FAILED` / `CANCELLED`), review state machine (`PENDING_REVIEW` -> `UNDER_REVIEW` -> `REVIEW_COMPLETED` / `REQUIRES_FOLLOW_UP`), retry linking, and telemetry.
- **`bankMessageRepository.js` (`nidhisetu_bank_messages_v1`):** Persists structured mock financial messages linked by request and correlation IDs.
- **`bankReviewRepository.js` (`nidhisetu_bank_reviews_v1`):** Records officer actions (`START_REVIEW`, `ADD_NOTE`, `MARK_CONSISTENT`, `REQUEST_FOLLOW_UP`, `CLOSE_REVIEW`, `REOPEN_REVIEW`) with mandatory substantive reasons (minimum 5 characters).

### 4. Workspaces & Integration
- **Officer Verification Console (`/officer/bank-verifications`):** Summary KPI cards, multi-criteria filters, and request creation wizard modal.
- **Officer Investigation Dossier (`/officer/bank-verifications/:requestId`):** Comprehensive 9-section dossier with side-by-side comparison, lien evaluation, mock SFMS message inspector (JSON view + 1-click clipboard copy), and officer adjudication toolbar.
- **Institution FDR Detail (`/institution/fdr/:id`):** Dedicated "Bank Confirmation Status — Simulation" card displaying confirmation progress without leaking internal officer notes or synthetic ledger internals.
- **Admin Bank Monitoring (`/admin/bank-monitoring`):** Platform-wide simulation telemetry, bank directory directory, and demo reset controls.

---

## 🧪 Automated Test Suite (105 Total Tests Passing)

NidhiSetu includes a complete automated test suite covering all 105 automated test specifications:
- **Module 02 Test Suite (`module02.test.jsx`):** 18 passing tests
- **Module 03 Test Suite (`module03.test.jsx`):** 27 passing tests
- **Module 04 Test Suite (`module04.test.jsx`):** 29 passing tests
- **Module 05 Test Suite (`module05.test.jsx`):** 31 passing tests covering:
  1. Synthetic bank registry initialization
  2. Idempotent demo seeding
  3. Verification request creation
  4. Duplicate request prevention
  5. Valid request lifecycle transitions
  6. Invalid transition rejection
  7. Structured message generation
  8. Message schema validation
  9. Exact-match simulation
  10. Amount mismatch scenario
  11. FDR not found scenario
  12. Missing lien scenario
  13. Beneficiary mismatch scenario
  14. Maturity mismatch scenario
  15. Timeout handling
  16. Malformed response handling
  17. Integer-paise comparison
  18. Date normalization
  19. Missing-field comparison
  20. Officer review actions
  21. Mandatory review reasons (>= 5 chars)
  22. Audit event generation
  23. Notification generation
  24. Institution ownership isolation
  25. Officer route protection
  26. Admin monitoring
  27. English/Hindi/Marathi rendering
  28. Module 01 regression
  29. Module 02 regression
  30. Module 03 regression
  31. Module 04 regression

---

## ⚖️ Module 06: Regulatory Compliance Intelligence, Deposit Adequacy & Risk Monitoring

Module 06 establishes an explainable **Regulatory Compliance Intelligence Engine** that deterministically evaluates educational institutions' declared FDR deposits against explicitly configured regulatory rules. It combines integer-paise deposit adequacy calculations, calendar-safe maturity and renewal risk monitoring, non-mutating evidence adapters from Module 04 (OCR document intelligence) and Module 05 (simulated bank confirmation), transparent categorical risk prioritization, an independent officer compliance case lifecycle, institutional adequacy transparency, and administrator portfolio telemetry.

> **Strict Regulatory Prototype Disclaimer:**  
> **Prototype Compliance Assessment — Not an Official Regulatory Determination**  
> All evaluations are deterministic advisory indicators based on configured demonstration rules. The platform does not enforce statutory penalties, automatic encashment, or legal sanctions.

### 1. Compliance Domain Architecture (`src/compliance/`)
- **`complianceRuleModel.js`:** Domain schema for configurable regulatory deposit requirements. Enforces versioning, validity periods, non-negative integer paise thresholds, and active rule conflict prevention.
- **`complianceRuleEngine.js`:** Deterministic rule resolution matching institutions against applicable active rules. Explicitly detects ambiguous configurations and returns `AMBIGUOUS_RULE_SELECTION` rather than silently picking arbitrary rules.
- **`depositAdequacyEngine.js`:** Precision integer paise financial adequacy calculator:
  - $\text{Shortfall} = \max(0, \text{Required Amount} - \text{Eligible Declared Amount})$
  - $\text{Surplus} = \max(0, \text{Eligible Declared Amount} - \text{Required Amount})$
  - $\text{Coverage \%} = (\text{Eligible Declared Amount} / \text{Required Amount}) \times 100$
  - Handles zero requirements cleanly without division by zero.
  - Implements strict **double-counting prevention**: excludes renewal predecessors (`SUPERSEDED_BY_RENEWAL`), duplicate certificate numbers (`DUPLICATE_INSTRUMENT_NUMBER`), duplicate document fingerprints, and draft/rejected certificates.
  - Returns structured classifications: `ADEQUATE_DECLARED`, `SHORTFALL_DECLARED`, `EXCESS_DECLARED`, `INDETERMINATE`, or `REQUIREMENT_NOT_CONFIGURED`.
- **`maturityRiskEngine.js`:** Calendar-safe date monitoring reusing Module 03 `fdrMaturityService.js` (eliminates timezone and DST drift). Evaluates approaching maturity tiers (90d, 60d, 30d, 7d critical), expired deposits without renewal, renewal under review, and validity duration shorter than configured rule tenures.
- **`documentRiskAdapter.js`:** Non-mutating consumer of Module 04 OCR findings. Detects amount mismatches, maturity mismatches, missing fields, duplicate document hashes, and unresolved officer findings while excluding stale runs. Distinguishes OCR statistical uncertainty from officer-confirmed discrepancies.
- **`bankEvidenceAdapter.js`:** Non-mutating consumer of Module 05 simulated bank confirmation outcomes. Strictly labels all signals as `SIMULATED_` (e.g., `SIMULATED_AMOUNT_MISMATCH`, `SIMULATED_LIEN_MISSING`) and enforces clear disclaimers (`SIMULATED_BANK_DISCLAIMER`).
- **`complianceRiskEngine.js`:** Explainable categorical risk prioritization (`INFORMATIONAL`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). Avoids deceptive black-box AI "fraud scores". Reserves `CRITICAL` for coinciding severe issues (e.g. deposit shortfall combined with expired deposit).
- **`complianceAssessmentBuilder.js`:** Synthesizes an immutable assessment snapshot with canonical FNV-1a input fingerprints (`generateCanonicalFingerprint`), preventing false staleness from arbitrary JavaScript key ordering and tracking reassessment lineage.
- **`complianceReportBuilder.js`:** Generates print-ready HTML layouts, structured JSON exports, and RFC-compliant CSV downloads with mandatory prototype and simulation disclaimers.
- **`complianceDemoFixtures.js`:** Clear synthetic demonstration rules and scenarios for AICTE Engineering (UG), Management (PG), Pharmacy, and State Polytechnic diplomas.

### 2. Versioned Storage Repositories (`src/storage/`)
- **`complianceRuleRepository.js` (`nidhisetu_compliance_rules_v1`):** Manages regulatory rules with version immutability (activated/retired rules cannot be edited in place; must be cloned into new draft versions). Conflicting active rules covering overlapping dates and identical scope are blocked upon activation.
- **`complianceAssessmentRepository.js` (`nidhisetu_compliance_assessments_v1`):** Stores historical assessment snapshots, marks superseded snapshots as `STALE`, preserves reassessment lineage, and triggers in-app notifications.
- **`complianceCaseRepository.js` (`nidhisetu_compliance_cases_v1`):** Manages officer compliance cases across state transitions (`OPEN` -> `UNDER_REVIEW` -> `FOLLOW_UP_REQUESTED` -> `AWAITING_INSTITUTION_RESPONSE` -> `RESOLVED` / `CLOSED` / `REOPENED`). Requires mandatory substantive rationale ($\ge 5$ characters) for resolution, closure, and reopening.
- **`complianceReviewRepository.js` (`nidhisetu_compliance_reviews_v1`):** Records officer review adjudications (`APPROVED_COMPLIANT`, `FLAGGED_NON_COMPLIANT`, `CONDITIONAL_CLEARANCE`, `CASE_REFERRED`) and signal dismissals with mandatory substantive rationale.

### 3. User Workspaces & Routes
| Route | Role | Description |
|-------|------|-------------|
| `/officer/compliance` | Officer / Admin | Regulatory Monitoring Console with KPI cards (Assessed, Shortfalls, Maturity Alerts, Active Cases, High Priority, Stale), multi-facet filtering, and run-assessment triggers. |
| `/officer/compliance/:institutionId` | Officer / Admin | Comprehensive 10-Section Compliance Dossier: Profile, Applicable Rule, Deposit Adequacy, Eligible & Excluded FDRs, Maturity Risks, Document Findings, Simulated Bank Evidence, Risk Prioritization, Officer Review & Case Adjudication, and Audit Lineage. |
| `/institution/compliance` | Institution | Institutional Deposit Adequacy & Requirement Overview. Visual financial comparison, progress bar, maturity alerts, and clarification response form. Institutions cannot access internal officer notes. |
| `/admin/compliance-rules` | Admin | Regulatory Rule Configuration & Versioning Studio. Create draft rules, clone draft versions, activate with conflict detection, and retire rules. |
| `/admin/compliance-monitoring` | Admin | Platform Portfolio Telemetry. Systemic shortfall exposure, adequacy coverage distribution, risk severity breakdown, and scoped reassessment triggers. |

### 4. Automated Test Suite (144 Total Tests Passing)
Module 06 adds 39 automated tests in `src/test/module06.test.jsx`:
1. Rule creation in draft status
2. Rule activation state transition
3. Rule retirement with historical preservation
4. Rule version immutability enforcement
5. Conflicting active rules detection
6. Missing rule handling (`REQUIREMENT_NOT_CONFIGURED`)
7. Exact deposit adequacy (`ADEQUATE_DECLARED`)
8. Deposit shortfall in integer paise (`SHORTFALL_DECLARED`)
9. Deposit surplus calculation (`EXCESS_DECLARED`)
10. Zero requirement safe division handling
11. Renewal double-count prevention & exclusions
12. Institution ownership isolation
13. Expired deposit detection with high severity
14. Upcoming maturity graduated warning tiers (7d, 30d, 60d, 90d)
15. Insufficient validity tenure detection
16. Stale OCR analysis exclusion on document hash change
17. Confirmed document discrepancy severity elevation
18. Simulated bank evidence strict `[SIMULATED]` labeling
19. Missing bank simulation handling (`NOT_SIMULATED`)
20. Deterministic categorical risk prioritization
21. Assessment snapshot persistence
22. Assessment fingerprint stability under key permutations
23. Reassessment lineage & stale snapshot marking
24. Compliance case creation (`OPEN`)
25. Case state machine transitions
26. Mandatory substantive resolution reason ($\ge 5$ chars)
27. Institution clarification response submission
28. Officer review adjudication history
29. Notification delivery to officer and institution portals
30. Report generation with strict disclaimers
31. CSV and JSON export generation
32. Multilingual translation verification (EN, HI, MR)
33. Officer compliance route protection
34. Admin rule management route protection
35. Complete end-to-end compliance lifecycle workflow
36. Module 01 regression: Public homepage branding
37. Module 02 regression: User accounts & role authentication
38. Module 03 regression: FDR repository & lifecycle states
39. Module 04 & 05 regression: Document intelligence & bank simulation repositories

---

## 🔄 Module 07: Smart FDR Renewal, Deposit Continuity & Simulated Lien Release Management

Module 07 implements an institutional and administrative engine for managing maturing security deposits, ensuring unbroken financial coverage across renewal transitions, and tracking administrative clearance of superseded certificates.

### 1. Storage Architecture (`src/storage/`)
- **`renewalPlanRepository.js`:** Computes and caches prospective renewal plans across 90d, 60d, 30d, 7d, matured, and overdue thresholds.
- **`renewalRequestRepository.js`:** Manages full renewal lifecycle, draft persistence, officer clarifications, institutional responses, and audit records.
- **`renewalReviewRepository.js`:** Records immutable officer scrutiny decisions with mandatory substantive justification ($\ge 5$ chars).
- **`releaseRequestRepository.js`:** Manages administrative clearance applications for superseded or discontinued certificates with non-banking disclaimers.
- **`renewalEscalationRepository.js`:** Idempotent tracking, acknowledgement, and resolution of maturity backlogs and review lapses.

### 2. Versioned Storage Keys
- `nidhisetu_renewal_plans_v1`: Evaluated maturity timelines and recommendations.
- `nidhisetu_renewal_requests_v1`: Active renewal and replacement applications (`RNL-YYYY-000001`).
- `nidhisetu_renewal_reviews_v1`: Historical officer scrutiny decisions and snapshots.
- `nidhisetu_release_requests_v1`: Administrative clearance applications (`REL-YYYY-000001`).
- `nidhisetu_renewal_escalations_v1`: Multi-tier escalations and notifications.

### 3. Core Domain Engines (`src/renewal/`)
- **Smart Renewal Planner (`renewalPlanner.js`):** Calendar-safe maturity scanning, planning deadlines (30 days prior), priority scoring (`URGENT`, `HIGH`, `MEDIUM`, `LOW`, `NORMAL`), and recommended next actions.
- **Renewal Eligibility Engine (`renewalEligibilityEngine.js`):** Verifies institutional ownership, blocks duplicate active renewal chains, prevents certificates from replacing themselves, and permits early renewals (>90 days).
- **Deposit Continuity Engine (`renewalContinuityEngine.js`):** Discrete date-interval timeline evaluator operating entirely in exact integer paise. Computes coverage before, during, and after transition; detects temporal start gaps and amount deficits without double-counting transitional overlaps.
- **Coverage Gap Detector (`renewalGapDetector.js`):** Flags delayed effective start dates, financial shortfalls, missing replacement certificates, and tenure deficits (<36 months).
- **Simulated Lien Continuity Adapter (`renewalLienAdapter.js`):** Bridges Module 05 mock banking verification to track joint lien continuity and prominently tags all signals as `[SIMULATED]`.
- **Release Eligibility Engine (`releaseEligibilityEngine.js`):** Evaluates replacement coverage, blocks clearance when compliance cases are active, and prevents erroneous releases.
- **Escalation Engine (`escalationEngine.js`):** Multi-tier escalation triggers (`URGENT`, `HIGH_PRIORITY`, `ATTENTION_REQUIRED`, `INFORMATIONAL`).
- **Renewal Report Builder (`renewalReportBuilder.js`):** Produces Deposit Continuity Statements, CSV exports, and audit summaries.

### 4. Workspaces & UI Routes
- `/institution/renewals`: Institutional renewal console with KPIs, filter tabs, portfolio table, and clarification reply modal.
- `/institution/renewals/new/:fdrId`: 6-step renewal application wizard with draft autosave and live continuity preview.
- `/institution/release-requests`: Administrative release request list and submission modal with non-banking notices.
- `/officer/renewals`: Officer renewal queue with multi-tier filters and search.
- `/officer/renewals/:renewalRequestId`: 10-section renewal dossier with visual interactive continuity timeline, simulated lien evidence, and scrutiny actions.
- `/officer/release-requests`: Officer administrative clearance queue.
- `/officer/release-requests/:requestId`: Release request scrutiny with mandatory confirmation safeguards.
- `/admin/renewal-monitoring`: Cross-institutional renewal telemetry, shortfall exposure metrics, escalation management, and demo state controls.

---

## 🏛️ Module 08: Unified Regulatory Command Center, Portfolio Analytics & Explainable Case Prioritization

Module 08 establishes a single-pane-of-glass executive command center and orchestration layer integrating Modules 01 through 07. It calculates derived operational metrics, deterministic risk priorities, and multi-module action inboxes without duplicating domain state machines or altering underlying records.

### 1. Architectural Components (`src/commandCenter/`)
- **`commandCenterModel.js`:** Enums (`RISK_PRIORITY`, `ALERT_STATUS`, `ALERT_SEVERITY`, `SOURCE_MODULES`, `REPORT_TYPES`), preference schemas, and mandatory simulation safeguards (`COMMAND_CENTER_PROTOTYPE_DISCLAIMER`, `BANK_SIMULATION_DISCLAIMER`).
- **`portfolioAggregator.js`:** Read-only aggregation across Modules 02–07. Normalizes institutional footprints, calculates integer-paise financial totals, and avoids double-counting superseded FDRs.
- **`portfolioMetricsEngine.js`:** Generates verified KPIs across registered institutions, active FDRs, maturity windows, pending reviews, open cases, and shortfall exposure in integer paise.
- **`riskPriorityEngine.js`:** Deterministic, explainable operational prioritization. Never produces fake "fraud probability" scores. Simulated bank discrepancies alone never produce critical real-world compliance determinations.
- **`unifiedCaseAggregator.js`:** Aggregates actionable items across Modules 03–07 into a normalized task queue with direct routing to authoritative domain workflows.
- **`institutionIntelligenceBuilder.js`:** Assembles 360-degree regulatory dossiers across profile, FDRs, coverage, timeline, OCR findings, simulated banking, compliance, and officer notes.
- **`evidenceTimelineBuilder.js`:** Chronologically merges cross-module event logs with deduplication and actor classification (`INSTITUTION_ACTION`, `OFFICER_DECISION`, `AUTOMATED_ASSESSMENT`, `SIMULATED_BANKING`).
- **`officerWorkloadEngine.js`:** Tracks open, high-priority, overdue, and unassigned tasks per officer with immutable assignment history and audit logs.
- **`operationalAlertEngine.js`:** Idempotent alert generation with deterministic fingerprinting. Requires mandatory justification for high/critical alert dismissals.
- **`analyticsTrendEngine.js`:** Computes historical submission, review, and renewal distributions derived strictly from authentic record timestamps.
- **`executiveReportBuilder.js`:** Generates print-ready executive summaries with CSV and JSON exports embedding statutory simulation notices.
- **`demoScenarioOrchestrator.js`:** Manages 10 guided Smart India Hackathon evaluator scenarios with safe step advancement and non-destructive reset controls.

### 2. Versioned Storage Repositories (`src/storage/`)
- `commandCenterPreferencesRepository.js` (`nidhisetu_command_center_preferences_v1`): User layout, density, and filter preferences.
- `commandCenterSnapshotRepository.js` (`nidhisetu_command_center_snapshots_v1`): Fingerprint-invalidated cache for aggregation snapshots.
- `officerAssignmentRepository.js` (`nidhisetu_officer_assignments_v1`): Task assignments, reassignments, and audit logs.
- `operationalAlertRepository.js` (`nidhisetu_operational_alerts_v1`): Active, acknowledged, resolved, and dismissed alerts.
- `demoScenarioRepository.js` (`nidhisetu_demo_scenarios_v1`): SIH scenario progress and evaluation states.

### 3. Workspaces & UI Routes
- `/officer/command-center`: 8-section regulatory command dashboard with Executive KPIs, Risk Distribution, Lifecycle Distribution, Maturity Monitoring Schedule, High-Priority Operational Alerts, Recent Activity, and Institution Attention List.
- `/admin/command-center`: Platform-wide governance console, officer workload allocation, and repository data quality & freshness monitoring.
- `/institution/portfolio`: Single-pane institutional portfolio overview with strict ownership isolation.
- `/officer/action-inbox`: Consolidated cross-module task queue with module, priority, officer, and date filters, plus task reassignment modal.
- `/officer/institution-intelligence/:institutionId`: 12-section 360-degree institutional intelligence dossier with PDF/CSV/JSON export.
- `/officer/portfolio-analytics`: Analytics dashboard with lightweight SVG/CSS charts, maturity exposure bars, and simulated bank outcomes.
- `/admin/demo-center`: SIH demonstration center featuring 10 guided evaluator walkthroughs and reset controls.

---

### Running the Test Suite
```bash
npx vitest run
```
**Test Results:** `226 passed (226)` across 7 test files:
- `src/test/module02.test.jsx`: 18 passed
- `src/test/module03.test.jsx`: 27 passed
- `src/test/module04.test.jsx`: 29 passed
- `src/test/module05.test.jsx`: 31 passed
- `src/test/module06.test.jsx`: 39 passed
- `src/test/module07.test.jsx`: 39 passed
- `src/test/module08.test.jsx`: 43 passed

---

## 🛠️ Verification & Build Commands

```bash
# Run Linter (0 errors across 198 files)
npm run lint

# Run Complete Automated Test Suite (226 tests passed)
npm test

# Production Build (compiled cleanly with route-level lazy loading)
npm run build

# Start Local Dev Server
npm run dev
```


---

## ⚠️ Known Prototype Limitations & Security Notice

1. **Browser-Local Prototype:** Banking simulation, compliance intelligence, and document OCR execute entirely client-side. Local browser storage (`localStorage` & `IndexedDB`) is subject to domain-level quotas and user-cleared caches.
2. **Strict Simulation Boundary:** Every banking message and response is synthetic. No real bank credentials, API keys, or live SFMS gateway connections exist.
3. **Prototype Compliance Engine:** All deposit requirements and adequacy calculations are based on configured demonstration rules. They do not constitute official statutory decisions by AICTE, UGC, or state directorates.
4. **Decoupled Module Review Decisions:** Administrative approvals (Module 03), OCR intelligence findings (Module 04), simulated bank confirmations (Module 05), and compliance case reviews (Module 06) maintain independent evidentiary states.
