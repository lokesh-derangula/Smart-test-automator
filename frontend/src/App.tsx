import { useState } from 'react';
import Dashboard from './components/Dashboard';
import GeneratorStudio from './components/GeneratorStudio';
import DataPipelineStudio from './components/DataPipelineStudio';
import TestRunnerSimulator from './components/TestRunnerSimulator';
import CicdHub from './components/CicdHub';


export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [apiKey, setApiKey] = useState<string>('');
  
  // Shared state to link generator output directly to other workspaces
  const [generatedSpec, setGeneratedSpec] = useState<{
    gherkin: string;
    pageCode: string;
    pageFilename: string;
    specCode: string;
    specFilename: string;
  } | null>(null);

  const [pipelineData, setPipelineData] = useState<any[]>([]);

  const handleGenerated = (data: {
    gherkin: string;
    pageCode: string;
    pageFilename: string;
    specCode: string;
    specFilename: string;
  }) => {
    setGeneratedSpec(data);
    
    // Parse step details for NLP flow visualization
    fetch('http://127.0.0.1:8001/api/preprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        story: 'N/A', // Story not required for raw step listing
        criteria: data.gherkin.replace(/Feature:.*[\s\S]*?Scenario:.*\n/, ''), // strip headers
      }),
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setPipelineData(resData.pipeline_table);
        }
      })
      .catch(err => console.error("Preprocessing error:", err));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'generator':
        return <GeneratorStudio apiKey={apiKey} setApiKey={setApiKey} onGenerated={handleGenerated} />;
      case 'pipeline':
        return <DataPipelineStudio pipelineData={pipelineData} />;
      case 'runner':
        return <TestRunnerSimulator generatedSpec={generatedSpec} />;
      case 'cicd':
        return <CicdHub />;
      default:
        return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', index: '01' },
    { id: 'generator', label: 'Test Gen', index: '02' },
    { id: 'pipeline', label: 'Pipeline', index: '03' },
    { id: 'runner', label: 'Runner', index: '04' },
    { id: 'cicd', label: 'CI/CD Hub', index: '05' },
  ];

  return (
    <div className="saas-app-card">
      {/* Top Header Navbar matching NixtNode layout */}
      <header className="saas-header">
        {/* Left Side: Brand Logo with brace formatting */}
        <div className="saas-logo-container" onClick={() => setActiveTab('dashboard')}>
          <span className="saas-logo-brace">{"}"}</span>
          <span>SpecFlowAI</span>
        </div>

        {/* Center: Navigation Links with superscript indexes */}
        <nav className="saas-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`saas-nav-link ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.label} <sup>{item.index}</sup>
            </button>
          ))}
        </nav>

        {/* Right Side: Configuration & Auth controls */}
        <div className="saas-auth-group">
          <input 
            type="password" 
            placeholder="OpenAI API Key" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              background: '#0b0a10',
              border: '1px solid rgba(192, 179, 245, 0.1)',
              borderRadius: '20px',
              padding: '8px 16px',
              color: '#ffffff',
              fontSize: '0.75rem',
              width: '150px',
              outline: 'none'
            }}
          />
        </div>
      </header>

      {/* Main App Body */}
      <main className="saas-body">
        {renderContent()}
      </main>

      {/* Monospace System status line footer */}
      <div className="promo-ribbon">
        <span>STATUS: <strong>ONLINE</strong> &nbsp;|&nbsp; LOCAL NLP ENGINE: <strong>OPTIMAL</strong> &nbsp;|&nbsp; PARALLEL RUNNER THREADS: <strong>CONNECTED (3)</strong></span>
      </div>
    </div>
  );
}
