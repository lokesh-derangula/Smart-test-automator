import { useState } from 'react';
import { 
  GitBranch, 
  Layers, 
  Workflow, 
  Copy, 
  Check,
  Cpu
} from 'lucide-react';

export default function CicdHub() {
  const [activeConfigTab, setActiveConfigTab] = useState<'gha' | 'playwright' | 'docker'>('gha');
  const [copied, setCopied] = useState(false);

  const configs = {
    saas_workflow: {
      gha: {
        filename: '.github/workflows/playwright.yml',
        desc: 'Automates execution in GitHub Actions, sets up caching, runs tests in parallel, and uploads HTML reports.',
        code: `name: Playwright Test Automation
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js Environment
      uses: actions/setup-node@v4
      with:
        node-version: 18
        cache: 'npm'
        
    - name: Install Dependencies
      run: npm ci
      
    - name: Install Playwright Browsers
      run: |
        npx playwright install --with-deps
      
    - name: Execute Automated Playwright Tests
      run: npx playwright test --workers=3
      
    - name: Upload Test Execution Reports
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30`
      },
      playwright: {
        filename: 'playwright.config.ts',
        desc: 'Enables parallel running using Playwrights test runner configurations, retry conditions, and viewport layouts.',
        code: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});`
      },
      docker: {
        filename: 'docker-compose.yml',
        desc: 'Pre-configures standard Docker multi-container services, networking, and environment variables.',
        code: `version: '3.8'
 
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
    volumes:
      - ./backend:/app
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend`
      }
    }
  };

  const currentConfig = configs.saas_workflow[activeConfigTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentConfig.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>CI/CD & Deployment Hub</h1>
        <p style={{ color: '#8f8ca4', fontSize: '0.95rem', marginTop: '4px' }}>
          Production configurations for deployment pipelines, continuous testing loops, and container environments.
        </p>
      </div>

      {/* Main Flow Explanation */}
      <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Workflow size={18} color="var(--secondary)" />
          Continuous Testing Workflow (DevOps Integration)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
          {[
            { step: '01', title: 'Code Push', desc: 'Developer pushes code containing user stories to GitHub repository.' },
            { step: '02', title: 'Actions Trigger', desc: 'GitHub Actions runner spins up a secure Docker environment.' },
            { step: '03', title: 'Parallel Execution', desc: 'Playwright runner runs tests in parallel on Chromium, Firefox, WebKit.' },
            { step: '04', title: 'HTML Reporting', desc: 'Reports are compiled and published. Failed specs capture videos & traces.' }
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#0b0a10', border: '1px solid rgba(192, 179, 245, 0.04)', padding: '20px', borderRadius: '16px', position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '16px', 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                color: 'rgba(192, 179, 245, 0.05)' 
              }}>
                {item.step}
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>{item.title}</div>
              <p style={{ color: '#8f8ca4', fontSize: '0.78rem', marginTop: '6px', lineHeight: '1.4' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Configurations Panels */}
      <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(192, 179, 245, 0.05)', paddingBottom: '12px' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveConfigTab('gha')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: activeConfigTab === 'gha' ? 'var(--primary)' : '#0b0a10',
                color: activeConfigTab === 'gha' ? 'white' : '#8f8ca4',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                border: activeConfigTab === 'gha' ? '1px solid var(--primary)' : '1px solid rgba(192, 179, 245, 0.05)'
              }}
            >
              <GitBranch size={14} />
              GitHub Actions
            </button>

            <button 
              onClick={() => setActiveConfigTab('playwright')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: activeConfigTab === 'playwright' ? 'var(--primary)' : '#0b0a10',
                color: activeConfigTab === 'playwright' ? 'white' : '#8f8ca4',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                border: activeConfigTab === 'playwright' ? '1px solid var(--primary)' : '1px solid rgba(192, 179, 245, 0.05)'
              }}
            >
              <Cpu size={14} />
              Playwright Config
            </button>

            <button 
              onClick={() => setActiveConfigTab('docker')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: activeConfigTab === 'docker' ? 'var(--primary)' : '#0b0a10',
                color: activeConfigTab === 'docker' ? 'white' : '#8f8ca4',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                border: activeConfigTab === 'docker' ? '1px solid var(--primary)' : '1px solid rgba(192, 179, 245, 0.05)'
              }}
            >
              <Layers size={14} />
              Docker Compose
            </button>
          </div>

          {/* Copy Button */}
          <button className="btn btn-white" onClick={handleCopy} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            {copied ? (
              <>
                <Check size={14} color="var(--success)" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        {/* Tab description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>File Name: <code>{currentConfig.filename}</code></div>
          <p style={{ color: '#8f8ca4', fontSize: '0.8rem' }}>{currentConfig.desc}</p>
        </div>

        {/* Code Blocks */}
        <div style={{
          background: '#0b0a10',
          border: '1px solid rgba(192, 179, 245, 0.05)',
          borderRadius: '16px',
          padding: '20px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.8rem',
          lineHeight: '1.55',
          overflowX: 'auto',
          maxHeight: '300px',
          color: '#34d399'
        }}>
          <pre>{currentConfig.code}</pre>
        </div>
      </div>
    </div>
  );
}
