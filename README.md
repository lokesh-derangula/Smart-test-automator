# SpecFlowAI: AI-Powered Test Case Generation & Automation Platform

Welcome to **SpecFlowAI**, an advanced enterprise-grade full-stack platform designed to automate BDD test case generation and produce ready-to-run Playwright TypeScript scripts using Page Object Model (POM) design patterns.

---

## 🚀 Key Features

1. **AI Test Generation Studio:** Convert Agile User Stories and Acceptance Criteria into Gherkin BDD features and maintainable Playwright POM scripts.
2. **Dual-Model Inference Engine:** Uses offline rule-based heuristic tokenizers or leverages OpenAI's GPT-4 APIs.
3. **NLP Pipeline & Preprocessing View:** Tabular part-of-speech (POS) tagging details mapped out step-by-step.
4. **T5 Fine-Tuning Studio:** Fine-tune translation models using uploaded custom training data.
5. **Playwright Parallel Runner Simulator:** Runs tests concurrently on emulated Chromium, Firefox, and WebKit browser threads.
6. **Production Configs:** Custom Docker-Compose scripts and GitHub Actions workflows for continuous integration.

---

## ⚙️ Model Training & Fine-Tuning Dataset Requirements

The T5 Model Fine-Tuning Studio requires uploading a training dataset. Training cannot be started without a valid file.

### CSV Schema Requirements
The uploaded CSV file must contain the following headers:
- `Story`: The raw user story text (e.g., *As a user I want to...*).
- `Criteria`: The acceptance criteria to be parsed and translated (e.g., *- Given the user is on the login page...*).

Example:
```csv
Story,Criteria
"As a user I want to log in"," - Given the user is on the login page
 - When the user enters credentials
 - Then the user should be on the dashboard"
```

---

## 🛠️ Tech Stack

- **Backend:** Python 3.10+, FastAPI, Pandas, NumPy, Scikit-learn, OpenAI API, Uvicorn
- **Frontend:** React 18, TypeScript, Vite, Lucide-React, custom Vanilla CSS Glassmorphic panels
- **Continuous Testing:** Playwright Test Runner (parallel configuration)
- **Deployment:** Docker & GitHub Actions CI/CD workflows

---

## 💻 Local Setup & Running Instructions

### Prerequisites
Ensure you have **Node.js (v18+)** and **Python (3.9+)** installed on your system.

### 1. Run the Python Backend Service
Navigate to the `backend` folder, install requirements, and spin up the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*The server will run on `http://127.0.0.1:8000`.*

### 2. Run the React Web App
Navigate to the `frontend` folder, install packages, and launch Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
*The web interface will start on `http://localhost:5173`.*

---

## 🐳 Docker Deployment

To build and launch both services locally inside Docker containers with a single command:
```bash
docker-compose up --build
```
The application will map:
- Web App UI: `http://localhost`
- Backend API endpoints: `http://localhost:8000`

---

## ⚙️ DevOps and CI/CD Pipeline

Continuous automation runs are configured in:
- [playwright.config.ts](playwright.config.ts) - Sets up browsers, retry counts, traces on failure, and parallel worker configurations.
- [.github/workflows/playwright.yml](.github/workflows/playwright.yml) - Automatic continuous testing integration workflow.
