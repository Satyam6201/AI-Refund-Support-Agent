# AI Customer Support Refund Agent

A production-grade, full-stack Next.js application powering an automated **AI Customer Support Refund Agent**. Built with **LangGraph.js**, **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Zod**.

The system features a **Zero-Trust Security Architecture** where natural-language intent understanding and tool selection are handled by the LLM, but **all business critical refund policy validation rules, customer ownership checks, and database mutations are executed 100% deterministically in application code**.

---

## 🎨 UI & Animation Highlights

- **Modern Glassmorphism Design**: Features custom CSS glass panels (`backdrop-blur-xl`), smooth border highlights, and dark mode compatibility across all pages.
- **Micro-Interactions & Animations**: Keyframe-driven entrance animations (`animate-fade-in-up`), pulsing logo glow effects (`animate-pulse-glow`), hover card elevation, and dynamic status badges.
- **Interactive Voice Controls**: Integrated Web Speech API with real-time Speech-to-Text, Text-to-Speech playback, and active soundwave ping indicators (`animate-ping`) during microphone listening mode.
- **Admin Audit Dashboard**: Real-Time Execution Trace inspection via Server-Sent Events (SSE), with dynamic execution status filtering (`ALL`, `COMPLETED`, `ESCALATED`, `FAILED`) and step-by-step metadata payload inspection.

---

## 🏗️ Architecture & Workflow

```
                        +-----------------------------------+
                        |       Customer Interface          |
                        |   Text Chat / Web Speech Voice    |
                        +-----------------------------------+
                                          |
                                          v
                        +-----------------------------------+
                        |   POST /api/chat or /api/agent    |
                        |    Server-Side Next.js Route      |
                        +-----------------------------------+
                                          |
                                          v
                        +-----------------------------------+
                        |    LangGraph.js State Machine     |
                        |      Reasoning & Tool Router      |
                        +-----------------------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
        +-------------------------+               +-------------------------+
        |  get_customer / order   |               |  check_refund_policy   |
        |  Prisma Database Read   |               | Deterministic Evaluator |
        +-------------------------+               +-------------------------+
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v
                        +-----------------------------------+
                        |          process_refund           |
                        | Zero-Trust & Idempotent Execution |
                        +-----------------------------------+
                                          |
                                          v
                        +-----------------------------------+
                        |     Real-Time Log Stream (SSE)    |
                        |        Admin Dashboard UI         |
                        +-----------------------------------+
```

---

## 🛠️ Tech Stack & Technical Rationale

| Technology | Role | Technical Rationale |
| :--- | :--- | :--- |
| **Next.js 15 (App Router)** | Full-Stack Framework | Hybrid React Server Components & API routes for server-side secret protection. |
| **TypeScript** | Language | Enforces strict compile-time type safety across domain models, tools, and API payloads. |
| **LangGraph.js** | Agent Framework | Typed `StateGraph` state machine for orchestrating LLM tool cycles with recursion bounds. |
| **LangChain JS** | LLM Abstraction | Model provider abstraction (`@langchain/openai`, `@langchain/google-genai`) and structured tool definitions. |
| **Prisma ORM** | Data Layer | Type-safe PostgreSQL client with database migrations and seed management. |
| **Zod** | Validation | Runtime schema validation for API requests and agent tool parameters. |
| **Tailwind CSS** | UI Styling | Utility-first CSS styling powering a modern, responsive SaaS dashboard design. |
| **Web Speech API** | Voice Engine | Native browser Speech-to-Text and Text-to-Speech integration sharing the exact same agent backend. |

---

## 🗄️ Database Schema & Models

Defined in [`prisma/schema.prisma`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/prisma/schema.prisma):

- **`Customer`**: Identity, contact details, tier (`VIP`, `REGULAR`, `NEW`), and order counters.
- **`Order`**: Purchase and delivery timestamps, product category, amount (INR), condition (`UNOPENED`, `OPENED`, `USED`, `DAMAGED`, `DEFECTIVE`), `isFinalSale`, and `refundStatus`.
- **`Refund`**: Holds processed refund amounts, decision status (`PENDING`, `APPROVED`, `REJECTED`), and audit reasons.
- **`AgentExecution`**: Tracks full AI chat sessions, input user queries, final decision output, and completion status (`IN_PROGRESS`, `COMPLETED`, `ESCALATED`, `FAILED`).
- **`AgentLog`**: Granular, step-by-step execution logs (`REQUEST_RECEIVED`, `CUSTOMER_LOOKUP`, `ORDER_LOOKUP`, `POLICY_CHECK`, `REFUND_PROCESSED`, `RETRY`, `ERROR`) without leaking hidden chain-of-thought system prompts.

---

## 📜 Strict Refund Policy Rules

Evaluated deterministically by `RefundPolicyEngine` ([`src/core/policy/refund-policy.ts`](file:///c:/Users/satya/OneDrive/Desktop/Project/Assignment/src/core/policy/refund-policy.ts)):

1. **30-Day Return Window**: Calculated from delivery date (`deliveryDate`). Orders delivered > 30 calendar days ago are rejected (`DELIVERY_WINDOW_EXCEEDED`).
2. **Unused Condition Standard**: Products marked as `USED` are ineligible for standard return (`PRODUCT_CONDITION_USED`).
3. **Non-Final-Sale Restriction**: Items purchased under final sale / clearance terms cannot be refunded (`FINAL_SALE_PRODUCT`).
4. **Duplicate Refund Prevention**: Rejects orders with status `REFUNDED` or existing refund records (`ALREADY_REFUNDED`).
5. **High-Value Escalation Threshold**: Refund requests > **₹10,000** require human manager review (`requiresHumanApproval: true`).
6. **Customer Ownership Verification**: Orders must belong to the active customer (`order.customerId === customerId`).
7. **Amount Cap**: Refund amount cannot exceed the original order purchase amount (`AMOUNT_EXCEEDS_ORDER`).
8. **Pre-processing Policy Gate**: No database mutation is permitted before deterministic policy validation succeeds.

---

## 🧰 Agent Tools

Exposed to LangGraph agent via Zod-validated tool definitions under `src/core/tools/`:

1. `get_customer`: Fetches customer profile by `customerId` or `email`.
2. `get_order`: Fetches order details by `orderId`.
3. `check_refund_policy`: Calls deterministic `RefundPolicyEngine.validate` to evaluate eligibility and human approval requirements.
4. `process_refund`: Performs **independent security double-checks** (customer existence, order existence, customer ownership, policy eligibility, duplicate refund check) and executes atomic database transactions via `RefundService`.

---

## 🔒 Security & Reliability Guarantees

1. **Zero-Trust Tool Execution**: `process_refund` re-evaluates all security constraints inside a database transaction before committing state changes. Even if an LLM incorrectly attempts to call `process_refund`, unauthorized requests are rejected at the application level.
2. **Idempotency**: `process_refund` queries for existing `Refund` records. If invoked multiple times for an order that was already refunded, it returns the existing refund record (`alreadyProcessed: true`) without creating duplicate transactions.
3. **Server-Side Key Isolation**: API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`) are accessed strictly on Node.js server environments and are never bundled in client JS.
4. **Bounded Iterations & Backoff**: Agent recursion limit set to `15` to prevent infinite loops. Transient errors trigger up to `maxRetries = 3` with exponential backoff ($2^{\text{attempt}-1} \times 300\text{ms}$).

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Node.js**: v18.0+ or v22.x
- **npm**: v10.x or v11.x

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_refund_agent?schema=public"
OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Validation & Seeding
```bash
# Validate Prisma schema
npx prisma validate

# Push schema to database
npx prisma db push

# Seed 15 customers and test scenarios
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Testing Suite

Run the automated 12-scenario test suite verifying deterministic business rules, security gates, idempotency, and retries:

```bash
npx tsx scripts/run-test-suite.ts
```

Run the security and reliability audit script:

```bash
npx tsx scripts/run-security-review.ts
```

---

## 🎬 Demo Scenarios

1. **Successful Refund**: Select customer **Aarav Sharma** (`cust_001_valid`) and request a refund for order `ord_101_valid_within_policy`. Result: Approved automatically.
2. **Policy Violation (30-Day Window)**: Select customer **Priya Patel** (`cust_002_expired`). Result: Rejected with clear explanation (`DELIVERY_WINDOW_EXCEEDED`).
3. **High-Value Escalation (> ₹10,000)**: Select customer **Kavya Nair** (`cust_006_high_value`). Result: Submitted for human manager review (`requiresHumanApproval: true`).
4. **Voice Scenario**: In `/chat`, click the microphone button, speak *"I want a refund for my order"*, and receive audio text-to-speech output powered by the exact same LangGraph backend pipeline.

---

## 📁 Project Directory Structure

```
Assignment/
├── prisma/
│   ├── schema.prisma         # Relational database models, enums & indexes
│   └── seed.ts               # Database seed script (15 customers & test cases)
├── scripts/
│   ├── run-test-suite.ts     # 12-scenario automated test runner
│   ├── run-security-review.ts# Security & reliability audit script
│   └── test-policy-and-tools.ts
├── src/
│   ├── app/                  # Next.js App Router pages & API routes
│   │   ├── admin/            # Real-Time Admin Log Dashboard (/admin)
│   │   ├── chat/             # Customer Support Chat UI (/chat)
│   │   ├── api/              # Server-side REST API route handlers
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx          # SaaS Landing Page
│   ├── components/           # Presentation React UI components
│   │   ├── admin/            # Admin metrics & log timeline components
│   │   ├── chat/             # Chat container & VoiceControls component
│   │   └── ui/               # Reusable atomic UI elements (Card, Badge, Button)
│   ├── core/                 # Core Business Engine & LangGraph Agent
│   │   ├── agent/            # StateGraph, nodes, runner & state annotations
│   │   ├── policy/           # Deterministic refund policy engine & constants
│   │   └── tools/            # Zod-validated LangChain agent tools
│   ├── services/             # Decoupled Data Access Layer (Prisma queries & fallbacks)
│   │   ├── agent-log.service.ts
│   │   ├── customer.service.ts
│   │   ├── order.service.ts
│   │   └── refund.service.ts
│   ├── lib/                  # Server-side LLM providers & DB singleton
│   │   ├── ai/               # LLM model abstraction, prompts & providers
│   │   ├── db.ts             # Prisma client singleton instance
│   │   └── utils.ts          # Utility functions
│   └── types/                # Zod schemas & TypeScript type interfaces
```

---

## 🔮 Future Improvements

1. **Multi-Agent Collaborative Routing**: Expand LangGraph state graph into specialized sub-agents (e.g., Shipping Agent, Dispute Resolution Agent, Fraud Detection Agent).
2. **Audio Stream Processing**: Transition from Web Speech API to server-side OpenAI Whisper / Realtime WebSocket audio streaming for ambient noise reduction.
3. **Advanced Analytics**: Add graphs tracking refund trends by product category and customer tier over time.
