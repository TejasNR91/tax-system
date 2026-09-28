# 🇮🇳 TaxSaathi AI — Complete System Guide

**Project:** Indian Tax Reasoning & Assistant System  
**Version:** 2.0  
**Stack:** React 18 + FastAPI + SQLite + AI Agent (Gemini / OpenAI)  
**License:** MIT

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features Added](#2-features-added)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Step-by-Step Setup Guide](#5-step-by-step-setup-guide)
6. [Running the Application](#6-running-the-application)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Environment Variables](#8-environment-variables)
9. [Testing](#9-testing)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Project Overview

**TaxSaathi AI** is a full-stack Indian tax reasoning, optimization, and assistant web application. It allows users to:

- Calculate income tax under **Old Regime** and **New Regime (Sec 115BAC)**
- Compare regimes and get smart, deterministic **regime recommendations**
- Compute **Capital Gains** (STCG / LTCG) for equity, real estate, and other assets
- Chat with an **AI Tax Assistant** powered by Google Gemini or OpenAI
- Retrieve **legal tax rules** from a built-in RAG knowledge base
- Register, log in, and manage their profile securely
- Reset passwords via **real Gmail OTP delivery**

---

## 2. Features Added

### 🔐 Authentication & Security System
- **User Registration** with username, email, full name, and optional PAN number
- **Bcrypt Password Hashing** (12 salt rounds) — plaintext passwords are never stored
- **Email + Username Login** — users can log in with either their username or email
- **Session Tokens** — cryptographically secure bearer tokens managed in-memory
- **Protected Routes** — all dashboard pages are guarded; unauthorized access redirects to `/login`
- **Session Persistence** — `localStorage` token survives page refresh; re-validates via `/api/auth/me`

### 📧 Gmail OTP Password Reset Flow
- **Forgot Password** page at `/forgot-password`
- **Real Gmail SMTP delivery** using `smtplib` with STARTTLS (Port 587)
- **6-digit secure OTP** generated using `secrets.randbelow()` — cryptographically random
- **OTP Hashing** — OTP is hashed using SHA-256 + unique cryptographic salt before DB storage (plaintext never persisted)
- **5-minute OTP expiry** with timestamp-based enforcement
- **5 max attempt lockout** — OTP is immediately invalidated after 5 wrong attempts
- **60-second rate-limit cooldown** between consecutive OTP requests per email
- **Anti-enumeration protection** — identical generic response whether email exists or not
- **Single-use reset token** (32-byte URL-safe, 10-minute validity) issued after OTP verification
- **OTP Verify** page at `/verify-otp`
- **Reset Password** page at `/reset-password`
- **Bcrypt re-hash** on new password set

### 🧮 Deterministic Tax Calculation Engine
- Supports Financial Years: **2023-24**, **2024-25**, **2025-26**
- **Slab-based tax computation** for both Old and New Regimes
- **Section 87A Rebate** with **marginal relief** for New Regime
- **Surcharge calculation** across all income brackets
- **4% Health & Education Cess** applied universally
- **Old Regime Deductions** supported:
  - Section 80C (up to ₹1,50,000)
  - Section 80D (Self ₹25,000 + Parents ₹25,000/₹50,000 for senior citizens)
  - Section 80CCD(1B) — NPS (up to ₹50,000)
  - Section 24(b) — Home Loan Interest (up to ₹2,00,000)
  - Section 10(13A) — HRA Exemption
  - Section 80TTA / 80TTB — Savings/Senior Interest Income
- **New Regime**: Standard deduction ₹75,000 + Employer NPS Sec 80CCD(2) only
- **Step-by-step audit trail** with every calculation

### 📈 Capital Gains Calculator
- **Equity / Equity Mutual Funds:**
  - STCG (Section 111A): **20%** tax rate (post-Budget July 2024)
  - LTCG (Section 112A): **12.5%** on gains > ₹1,25,000 exemption
- **Real Estate:**
  - STCG: Taxed at slab rate (~30%)
  - LTCG: 20% (holding > 24 months)
- **Other Assets:** 12.5% LTCG / 20% STCG
- Automatically detects holding duration from purchase and sale dates

### 🤖 AI Tax Assistant (RAG + Tool-Calling Agent)
- **Multi-turn conversation memory** — retains past user queries in session
- **Financial Year extraction** from natural language
- **NLP parameter parsing** — salary, 80C, 80D, home loan, NPS amounts extracted from plain text
- **Capital gains scenario detection** and dispatch to CG calculator tool
- **Regime comparison tool** auto-triggered when salary or comparison keywords detected
- **RAG Knowledge Retrieval** — searches a curated knowledge base of Indian tax sections
- **LLM synthesis** via Google Gemini (`gemini-1.5-flash`) with deterministic fallback
- **Legal citations** included in every response with Income Tax India source URLs
- **Audit trail** for every agent reasoning step

### 📰 Tax News Feed
- Real-time Indian tax news aggregated from public RSS/news sources
- Available at `/news` (public, no login required)

### 📊 Regime Comparison Tool
- Side-by-side comparison of Old vs New Tax Regime
- Shows exact tax liability, taxable income, and deductions for both
- Provides a clear monetary **savings figure** and **regime recommendation**
- Break-even deduction threshold calculation

### 🏠 Planning Simulator
- What-if scenario tool — simulate the tax impact of adding/changing 80C, NPS, health insurance investments
- Shows **ROI of tax savings** as a percentage of investment

### ⚖️ Automated Evaluation Framework
- Benchmark suite with test scenarios at `/api/eval/run`
- Scores the system on:
  - **Calculation Accuracy** (40% weight)
  - **Retrieval Accuracy** (30% weight)
  - **Citation Validity** (30% weight)
  - **Hallucination Rate** (deducted)
- Results available at `/evaluation` (protected)

### 🗄️ SQLite Database
- **`users` table** — stores user profile with bcrypt hashed passwords
- **`password_resets` table** — tracks OTP records, hashed OTPs, expiry, attempts, and reset tokens
- **`audit_logs` table** — stores AI agent reasoning steps and tool invocations
- **`calculation_history` table** — stores saved tax calculations per user

### 🎨 Frontend (React 18 + Vite)
- **Glassmorphism dark-mode UI** with custom CSS design tokens
- Pages: Landing, Login, Register, Dashboard, TaxCalculator, CompareRegimes, Assistant, CapitalGains, PlanningSimulator, SlabInfo, Sources, History, Evaluation, News
- **Recharts** for interactive tax breakdown visualisations
- **Axios** for API communication with bearer token injection
- **React Router v6** with protected route wrappers
- Responsive design — works on desktop and mobile

---

## 3. Project Structure

```
tax-system/
├── backend/                        # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point, CORS, router registration
│   │   ├── ai/
│   │   │   ├── agent.py            # TaxReasoningAgent — NLP, tool dispatch, RAG synthesis
│   │   │   ├── llm_provider.py     # LLMProvider — Gemini / OpenAI / deterministic fallback
│   │   │   └── tools.py            # Tool functions: tax calc, CG, comparison, simulation
│   │   ├── db/
│   │   │   ├── database.py         # SQLite init, all DB helper functions, bcrypt utils
│   │   │   └── tax_system.db       # SQLite database file (auto-created on first run)
│   │   ├── evaluation/
│   │   │   ├── evaluator.py        # TaxSystemEvaluator — automated benchmark runner
│   │   │   └── scenarios.json      # Test scenarios with expected outputs
│   │   ├── rag/
│   │   │   ├── retriever.py        # TaxKnowledgeRetriever — keyword search over KB
│   │   │   └── knowledge_base.json # Curated Indian tax sections knowledge base
│   │   ├── routers/
│   │   │   ├── auth.py             # Auth endpoints: register, login, OTP, reset, logout
│   │   │   ├── chat.py             # /api/chat endpoint — AI assistant query
│   │   │   ├── news.py             # /api/tax/news endpoint — tax news feed
│   │   │   ├── rag.py              # /api/rag/rules, /api/eval/run endpoints
│   │   │   └── tax.py              # /api/tax/* endpoints — calculate, compare, CG, simulate
│   │   ├── services/
│   │   │   └── email_service.py    # Gmail SMTP OTP email delivery service
│   │   └── tax_engine/
│   │       ├── calculator.py       # Core deterministic tax engine (slabs, cess, surcharge)
│   │       ├── models.py           # Pydantic models for input/output validation
│   │       └── rules_config.json   # Tax slab rules, rebate limits, surcharge rates by FY
│   └── tests/
│       ├── run_tests.py            # Test runner script
│       ├── test_agent.py           # AI agent integration tests
│       ├── test_auth.py            # Authentication unit tests
│       ├── test_auth_full_flow.py  # End-to-end auth + OTP flow tests
│       ├── test_calculator.py      # Tax engine regression tests
│       ├── test_news.py            # News endpoint tests
│       └── test_rag.py             # RAG retriever tests
├── src/                            # React Frontend (Vite)
│   ├── App.jsx                     # Root app, router configuration
│   ├── main.jsx                    # React DOM entry point
│   ├── index.css                   # Global glassmorphism design system tokens
│   ├── components/
│   │   ├── Navbar.jsx              # Navigation bar with auth state
│   │   ├── ProtectedRoute.jsx      # Session-guard HOC for private routes
│   │   └── HelpTooltip.jsx         # Contextual help tooltips
│   ├── context/                    # React context for auth state
│   ├── pages/
│   │   ├── Landing.jsx             # Public landing page with hero
│   │   ├── Login.jsx               # Login form
│   │   ├── Register.jsx            # Registration form with PAN validation
│   │   ├── ForgotPassword.jsx      # Email entry for OTP dispatch
│   │   ├── VerifyOTP.jsx           # 6-digit OTP input screen
│   │   ├── ResetPassword.jsx       # New password form with token validation
│   │   ├── Dashboard.jsx           # User dashboard with summary cards
│   │   ├── TaxCalculator.jsx       # Full tax calculator with slab breakdown
│   │   ├── CompareRegimes.jsx      # Old vs New regime comparator
│   │   ├── Assistant.jsx           # AI chat assistant interface
│   │   ├── CapitalGains.jsx        # STCG / LTCG calculator
│   │   ├── PlanningSimulator.jsx   # Tax planning what-if simulator
│   │   ├── SlabInfo.jsx            # Tax slab reference info page
│   │   ├── Sources.jsx             # Legal citations and sources
│   │   ├── History.jsx             # Saved calculation history
│   │   ├── Evaluation.jsx          # System evaluation benchmark viewer
│   │   └── News.jsx                # Indian tax news feed
│   ├── steps/                      # Multi-step form components
│   └── utils/                      # Frontend utility helpers
├── server/                         # Optional Node.js/Express proxy server
│   ├── index.js                    # Express server entry point
│   ├── taxEngine.js                # JS-side tax engine (standalone)
│   └── package.json
├── .env                            # Secret environment variables (NOT committed to git)
├── .env.example                    # Safe template showing all required env variable keys
├── requirements.txt                # Python backend dependencies
├── package.json                    # Frontend npm dependencies and scripts
├── vite.config.js                  # Vite build configuration with API proxy
├── index.html                      # HTML shell for Vite SPA
├── Tax_system.md                   # This documentation file
└── tax system 2.md                 # Detailed system requirements document (v2)
```

---

## 4. Prerequisites

Before you begin, make sure the following are installed on your machine:

| Tool | Version | Check Command |
|------|---------|---------------|
| **Python** | 3.10+ | `python3 --version` |
| **pip** | 23+ | `pip3 --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Git** | Any | `git --version` |

**Optional (for AI features):**
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)  
- Or an **OpenAI API key** from [platform.openai.com](https://platform.openai.com/)

**Optional (for real OTP emails):**
- A **Gmail account** with **App Password** enabled  
  _(Required: 2-Step Verification must be ON in your Google Account)_

---

## 5. Step-by-Step Setup Guide

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/tax-system.git
cd tax-system
```

---

### Step 2 — Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set the following:

```ini
# Server
PORT=8000
HOST=127.0.0.1
DEBUG=True

# Security (generate a strong random key for production)
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Gmail SMTP — for real OTP email delivery
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=TaxSaathi AI <your-gmail@gmail.com>
EMAIL_USE_TLS=True

# OTP Policies
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_COOLDOWN_SECONDS=60

# AI Provider (at least one key required for AI features)
GEMINI_API_KEY=your-gemini-api-key-here
# OPENAI_API_KEY=your-openai-api-key-here   # optional fallback
```

> **⚠️ Important:** Never commit your `.env` file to GitHub. It is already listed in `.gitignore`.

---

### Step 3 — Set Up Python Backend

#### 3.1 Create a Virtual Environment

```bash
# From the project root
python3 -m venv venv

# Activate on macOS / Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

#### 3.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 3.3 Verify Installation

```bash
python3 -c "import fastapi, uvicorn, bcrypt, pydantic; print('✅ All backend dependencies installed successfully')"
```

---

### Step 4 — Set Up Frontend

#### 4.1 Install Node.js Dependencies

```bash
# From the project root
npm install
```

#### 4.2 Verify Installation

```bash
npm list react vite axios recharts
```

---

### Step 5 — Initialise the Database

The SQLite database is automatically initialised when the backend starts for the first time. It creates the `users`, `password_resets`, `audit_logs`, and `calculation_history` tables.

If you want to manually trigger it:

```bash
cd /Users/tejasnr/Desktop/tax-system/backend
export PYTHONPATH="$(pwd):$PYTHONPATH"
python3 -c "from app.db.database import init_db; init_db(); print('✅ Database initialised')"
```

---

### Step 6 — Set Up Gmail App Password (for OTP Feature)

> Skip this step if you don't need real email delivery.

1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**
2. Enable **2-Step Verification** if not already enabled
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Click **"Select App"** → choose **"Mail"**
5. Click **"Select Device"** → choose **"Other"** → type `TaxSaathi`
6. Click **"Generate"** — copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
7. In `.env`, set:
   ```ini
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop   # paste without spaces
   ```

---

## 6. Running the Application

### Start Backend (FastAPI — Port 8000)

Open a terminal and run:

```bash
cd /Users/tejasnr/Desktop/tax-system/backend
source ../venv/bin/activate       # activate virtual env
export PYTHONPATH="$(pwd):$PYTHONPATH"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API will be live at: **http://127.0.0.1:8000**  
Swagger docs available at: **http://127.0.0.1:8000/docs**

---

### Start Frontend (Vite Dev Server — Port 5173)

Open a second terminal and run:

```bash
cd /Users/tejasnr/Desktop/tax-system
npm run dev
```

Frontend will be live at: **http://localhost:5173**

---

### Access the App

Open your browser and go to: **http://localhost:5173**

You should see the TaxSaathi AI landing page. Click **"Get Started"** or **"Sign Up"** to create an account and begin.

---

## 7. API Endpoints Reference

### Authentication (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Log in (returns bearer token) |
| `GET` | `/api/auth/me` | Get current logged-in user profile |
| `POST` | `/api/auth/logout` | Invalidate session token |
| `POST` | `/api/auth/forgot-password` | Dispatch 6-digit Gmail OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP and get reset token |
| `POST` | `/api/auth/reset-password` | Set new password with reset token |

### Tax Engine (`/api/tax/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tax/calculate` | Calculate tax for one regime |
| `POST` | `/api/tax/compare` | Compare Old vs New regime |
| `POST` | `/api/tax/capital-gains` | Calculate STCG / LTCG |
| `POST` | `/api/tax/simulate` | What-if investment planning |
| `GET` | `/api/tax/news` | Fetch Indian tax news |

### AI Assistant & RAG (`/api/chat/`, `/api/rag/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send query to AI Tax Assistant |
| `GET` | `/api/rag/rules` | Retrieve tax knowledge base |
| `GET` | `/api/eval/run` | Run automated evaluation suite |

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ Yes | App security key (min 32 chars) |
| `ALGORITHM` | ✅ Yes | JWT algorithm (default: `HS256`) |
| `EMAIL_USER` | ⚠️ OTP only | Gmail address for SMTP |
| `EMAIL_PASSWORD` | ⚠️ OTP only | Gmail 16-char App Password |
| `GEMINI_API_KEY` | ⚠️ AI only | Google Gemini API key |
| `OPENAI_API_KEY` | Optional | OpenAI key (fallback LLM) |
| `OTP_EXPIRY_MINUTES` | Optional | OTP validity in minutes (default: `5`) |
| `OTP_MAX_ATTEMPTS` | Optional | Max wrong OTP tries (default: `5`) |
| `OTP_COOLDOWN_SECONDS` | Optional | Cooldown between OTP requests (default: `60`) |

---

## 9. Testing

### Run All Backend Tests

```bash
cd /Users/tejasnr/Desktop/tax-system
source venv/bin/activate
export PYTHONPATH="$(pwd)/backend:$PYTHONPATH"
python backend/tests/run_tests.py
```

### Run Full Authentication & OTP Flow Test

```bash
python backend/tests/test_auth_full_flow.py
```

### Run Tax Engine Regression Suite

```bash
python backend/tests/test_calculator.py
```

### Run Evaluation Benchmark (via API)

Make sure the backend is running, then:

```bash
curl http://127.0.0.1:8000/api/eval/run
```

Or visit **http://127.0.0.1:8000/api/eval/run** in your browser.

---

## 10. Troubleshooting

### ❌ `ModuleNotFoundError: No module named 'app'`

**Fix:** Set the `PYTHONPATH` correctly before running uvicorn:

```bash
cd /Users/tejasnr/Desktop/tax-system/backend
export PYTHONPATH="$(pwd):$PYTHONPATH"
uvicorn app.main:app --reload
```

---

### ❌ `pip install` fails on `bcrypt` or `cryptography`

**Fix:** Update pip and install build tools:

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

### ❌ Gmail OTP not delivered

**Check:**
1. `EMAIL_USER` and `EMAIL_PASSWORD` are correctly set in `.env`
2. Gmail **2-Step Verification** is enabled
3. You used an **App Password** (not your regular Gmail password)
4. Check spam/junk folder in your email client

---

### ❌ Frontend shows "Network Error" or CORS issues

**Check:**
1. Backend is running on **port 8000** (`uvicorn app.main:app --port 8000`)
2. Frontend is running on **port 5173** (`npm run dev`)
3. The `vite.config.js` proxy is correctly pointing to `http://127.0.0.1:8000`

---

### ❌ Gemini / AI responses not working

**Fix:** Add `GEMINI_API_KEY` to your `.env` file. Without it, the system falls back to the built-in deterministic response engine, which still provides accurate tax calculations and citations — just without natural language synthesis.

---

## ✅ You're Ready!

After completing all steps, your TaxSaathi AI system will be fully operational:

- 🖥️ **Frontend:** http://localhost:5173
- 🔌 **Backend API:** http://127.0.0.1:8000
- 📖 **Swagger Docs:** http://127.0.0.1:8000/docs

---

*© 2026 TejasNR91 — TaxSaathi AI. Licensed under MIT.*
