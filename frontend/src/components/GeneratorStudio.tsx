import { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  RefreshCw, 
  Code2, 
  FileCode,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Type,
  MousePointer,
  CheckCircle2,
  FileText,
  HelpCircle,
  FolderOpen,
  Eye,
  Info
} from 'lucide-react';
import TestRunnerSimulator from './TestRunnerSimulator';

interface GeneratorStudioProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onGenerated: (data: { gherkin: string; pageCode: string; pageFilename: string; specCode: string; specFilename: string }) => void;
  generatedSpec: {
    gherkin: string;
    pageCode: string;
    pageFilename: string;
    specCode: string;
    specFilename: string;
  } | null;
}

export default function GeneratorStudio({ apiKey, setApiKey, onGenerated, generatedSpec }: GeneratorStudioProps) {
  // Wizard state: 1 = Input, 2 = Roadmap, 3 = Execution
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [featureName, setFeatureName] = useState('User Login');
  const [story, setStory] = useState(
    'As a registered user\nI want to log in to my account\nSo that I can access my dashboard.'
  );
  const [criteria, setCriteria] = useState(
    '- The user is on the login page\n- The user enters "testuser" in the username field\n- The user enters "password123" in the password field\n- The user clicks the login button\n- The user should be redirected to the "/dashboard" page'
  );

  const [useOpenAI, setUseOpenAI] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Roadmap states
  const [parsedSteps, setParsedSteps] = useState<any[]>([]);
  const [pipelineTable, setPipelineTable] = useState<any[]>([]);
  const [modeUsed, setModeUsed] = useState('Local NLP Engine');
  
  // Tab within Step 2 Code Visualizer Studio
  const [activeStudioTab, setActiveStudioTab] = useState<'spec' | 'pom' | 'nlp' | 'readme'>('spec');

  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Template lists
  const templates = [
    {
      title: '🔑 Account Login Flow',
      featureName: 'User Login',
      story: 'As a registered user\nI want to log in to my account\nSo that I can access my dashboard.',
      criteria: '- The user is on the login page\n- The user enters "testuser" in the username field\n- The user enters "password123" in the password field\n- The user clicks the login button\n- The user should be redirected to the "/dashboard" page'
    },
    {
      title: '🛒 Shopping Cart Checkout',
      featureName: 'Cart Checkout',
      story: 'As a guest shopper\nI want to purchase items in my cart\nSo that I can complete my order.',
      criteria: '- The user is on the product detail page\n- The user clicks the "Add to Cart" button\n- The user opens the shopping cart page\n- The user clicks the "Checkout" button\n- The user enters "123 Main St" in the shipping address field\n- The user clicks the "Place Order" button\n- The user should see the "Order Confirmation" message'
    },
    {
      title: '📝 User Registration',
      featureName: 'Account Signup',
      story: 'As a new visitor\nI want to register a new account\nSo that I can become a member.',
      criteria: '- The user is on the signup page\n- The user enters "newuser@example.com" in the email field\n- The user enters "securePassword99" in the password field\n- The user enters "securePassword99" in the confirm password field\n- The user clicks the "Sign Up" button\n- The user should see the "Welcome to the Platform" banner'
    }
  ];

  const loadTemplate = (tpl: typeof templates[0]) => {
    setFeatureName(tpl.featureName);
    setStory(tpl.story);
    setCriteria(tpl.criteria);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/generate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story,
          criteria,
          apiKey: useOpenAI ? apiKey : null,
          featureName
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setModeUsed(data.mode);
        setParsedSteps(data.steps || []);
        setPipelineTable(data.pipeline_table || []);
        
        onGenerated({
          gherkin: data.gherkin,
          pageCode: data.page_code,
          pageFilename: data.page_filename,
          specCode: data.spec_code,
          specFilename: data.spec_filename
        });
        
        // Advance to roadmap view
        setCurrentStep(2);
      } else {
        alert("Generation failed: " + data.detail);
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting API backend. Please ensure the server is running on localhost:8001.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSpec) return;
    let textToCopy = '';
    if (activeStudioTab === 'spec') textToCopy = generatedSpec.specCode;
    else if (activeStudioTab === 'pom') textToCopy = generatedSpec.pageCode;
    else if (activeStudioTab === 'readme') textToCopy = getReadmeContent();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    if (!generatedSpec) return;
    let filename = '';
    let content = '';

    if (activeStudioTab === 'spec') {
      filename = generatedSpec.specFilename;
      content = generatedSpec.specCode;
    } else if (activeStudioTab === 'pom') {
      filename = generatedSpec.pageFilename;
      content = generatedSpec.pageCode;
    } else if (activeStudioTab === 'readme') {
      filename = 'README.md';
      content = getReadmeContent();
    }

    fetch("http://127.0.0.1:8001/api/download/file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ filename, content })
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error("API download error:", err);
        const localBlob = new Blob([content], { type: 'text/plain' });
        const localUrl = URL.createObjectURL(localBlob);
        const a = document.createElement('a');
        a.href = localUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(localUrl);
      });
  };

  const handleDownloadZip = () => {
    if (!generatedSpec) return;
    setDownloadingZip(true);
    
    fetch("http://127.0.0.1:8001/api/download-zip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        featureName,
        gherkin: generatedSpec.gherkin,
        pageFilename: generatedSpec.pageFilename,
        pageCode: generatedSpec.pageCode,
        specFilename: generatedSpec.specFilename,
        specCode: generatedSpec.specCode
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("ZIP generation failed");
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const file_base = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'test';
        a.download = `${file_base}_playwright_suite.zip`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error("ZIP download error:", err);
        alert("Failed to download ZIP file from backend.");
      })
      .finally(() => {
        setDownloadingZip(false);
      });
  };

  const getReadmeContent = () => {
    if (!generatedSpec) return '';
    const file_base = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'test';
    return `# Generated Playwright Automation Suite
Created automatically with SpecFlowAI BDD & Playwright Test Studio.

## Folder Structure
- \`tests/\`: Contains the generated Playwright specifications (\`${generatedSpec.specFilename}\`, \`${file_base}.feature\`).
- \`tests/${generatedSpec.pageFilename}\`: The modular Page Object Model class.
- \`playwright.config.ts\`: Configured for parallel cross-browser runs.
- \`package.json\`: NPM dependencies.

## Local Run
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Install Playwright browsers:
   \`\`\`bash
   npx playwright install
   \`\`\`
3. Run tests:
   \`\`\`bash
   npx playwright test
   \`\`\`
`;
  };

  const highlightCode = (code: string, type: 'gherkin' | 'typescript' | 'markdown') => {
    if (!code) return '';
    let escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (type === 'gherkin') {
      escaped = escaped.replace(
        /\b(Feature|Scenario|Given|When|Then|And|But):?\b/g,
        '<span style="color: #c0b3f5; font-weight: bold;">$1</span>'
      );
      escaped = escaped.replace(
        /("[^"]*")/g,
        '<span style="color: #34d399;">$1</span>'
      );
    } else if (type === 'markdown') {
      escaped = escaped.replace(
        /^(#+\s+.*)$/gm,
        '<span style="color: #c0b3f5; font-weight: bold;">$1</span>'
      );
      escaped = escaped.replace(
        /`([^`]+)`/g,
        '<span style="color: #22d3ee; font-family: monospace;">$1</span>'
      );
      escaped = escaped.replace(
        /(\*\*\s*.*?\s*\*\*)/g,
        '<span style="color: #ffffff; font-weight: 700;">$1</span>'
      );
    } else {
      const keywords = [
        'import', 'from', 'export', 'class', 'readonly', 'constructor', 
        'async', 'await', 'let', 'const', 'new', 'describe', 'beforeEach', 
        'expect', 'test'
      ];
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'g');
        escaped = escaped.replace(
          regex,
          `<span style="color: #a78bfa; font-weight: 600;">${kw}</span>`
        );
      });
      escaped = escaped.replace(
        /("[^"]*")/g,
        '<span style="color: #34d399;">$1</span>'
      );
      escaped = escaped.replace(
        /(\/\/.*)/g,
        '<span style="color: #8f8ca4; font-style: italic;">$1</span>'
      );
    }
    return escaped;
  };

  const getActionIcon = (action: string, expectation: string) => {
    const act = action.toLowerCase();
    const exp = expectation.toLowerCase();
    
    if (act === 'goto') return <Globe size={18} style={{ color: 'var(--secondary)' }} />;
    if (act === 'type' || act === 'fill') return <Type size={18} style={{ color: '#22d3ee' }} />;
    if (act === 'click') return <MousePointer size={18} style={{ color: '#fb923c' }} />;
    if (exp !== 'none') return <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />;
    return <FileText size={18} style={{ color: '#a78bfa' }} />;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* 3-Step Wizard Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(192,179,245,0.06)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Magic Automation Studio</h1>
          <p style={{ color: '#8f8ca4', fontSize: '0.9rem', marginTop: '4px' }}>
            Automate test scenario planning and execution without writing code.
          </p>
        </div>

        {/* Wizard progress bars */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[
            { step: 1, label: '1. Describe' },
            { step: 2, label: '2. Review Map & Code' },
            { step: 3, label: '3. Run Browser' }
          ].map(s => (
            <button 
              key={s.step}
              onClick={() => {
                if (s.step === 1 || generatedSpec) {
                  setCurrentStep(s.step as any);
                }
              }}
              disabled={s.step > 1 && !generatedSpec}
              style={{
                background: currentStep === s.step ? 'var(--primary)' : 'rgba(192, 179, 245, 0.04)',
                border: currentStep === s.step ? '1px solid var(--secondary)' : '1px solid rgba(192, 179, 245, 0.08)',
                color: currentStep === s.step ? '#ffffff' : (generatedSpec ? '#d1cde4' : '#6b6880'),
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: (s.step === 1 || generatedSpec) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main step routing */}
      {currentStep === 1 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'rgba(140, 122, 230, 0.03)', border: '1px solid rgba(140, 122, 230, 0.1)', padding: '16px 20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)' }}>Step 1: Write in Plain English</h3>
            <p style={{ color: '#8f8ca4', fontSize: '0.82rem', marginTop: '4px', lineHeight: '1.4' }}>
              Select a pre-configured template card to populate testing criteria instantly, or fill out custom requirements below.
            </p>
          </div>

          {/* Quick template cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {templates.map((tpl, i) => (
              <div 
                key={i}
                onClick={() => loadTemplate(tpl)}
                style={{
                  background: '#12111a',
                  border: '1px solid rgba(192,179,245,0.08)',
                  padding: '18px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                className="hover-glow-card"
              >
                <div style={{ fontSize: '1.3rem' }}>{tpl.title.split(' ')[0]}</div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>{tpl.title.substring(2)}</h4>
                <p style={{ color: '#8f8ca4', fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {tpl.story.split('\n')[1] || tpl.story}
                </p>
              </div>
            ))}
          </div>

          {/* Text Input Forms */}
          <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#12111a' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 700 }}>Feature Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={featureName} 
                onChange={(e) => setFeatureName(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 700 }}>User Story (Role & Purpose)</label>
                <textarea 
                  rows={6} 
                  className="input-field" 
                  value={story} 
                  onChange={(e) => setStory(e.target.value)} 
                  style={{ resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 700 }}>Acceptance Criteria (Step List)</label>
                <textarea 
                  rows={6} 
                  className="input-field" 
                  value={criteria} 
                  onChange={(e) => setCriteria(e.target.value)}
                  style={{ resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>
            </div>

            {/* Inference Toggle bar */}
            <div style={{ borderTop: '1px solid rgba(192, 179, 245, 0.05)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>NLP Translation Engine</span>
                <span style={{ fontSize: '0.72rem', color: '#8f8ca4' }}>Select between the local fine-tuned T5 weights or GPT-4 cloud parser.</span>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#0b0a10', borderRadius: '20px', padding: '3px', border: '1px solid rgba(192, 179, 245, 0.05)' }}>
                  <button 
                    onClick={() => setUseOpenAI(false)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: !useOpenAI ? 'var(--primary)' : 'transparent',
                      color: !useOpenAI ? 'white' : '#8f8ca4',
                      transition: 'all 0.2s'
                    }}
                  >
                    Local Parser (T5)
                  </button>
                  <button 
                    onClick={() => setUseOpenAI(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: useOpenAI ? 'var(--primary)' : 'transparent',
                      color: useOpenAI ? 'white' : '#8f8ca4',
                      transition: 'all 0.2s'
                    }}
                  >
                    GPT-4 Engine
                  </button>
                </div>

                {useOpenAI && (
                  <input 
                    type="password" 
                    className="input-field" 
                    placeholder="sk-..." 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    style={{ width: '180px', padding: '6px 12px', fontSize: '0.8rem' }}
                  />
                )}
              </div>
            </div>

            <button 
              className="btn btn-gradient" 
              onClick={handleGenerate}
              disabled={loading}
              style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Compiling Magic Suite...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Compile Magic Suite</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && generatedSpec && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Info Banner */}
          <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '16px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>Step 2: Review Map & Code</h3>
              <p style={{ color: '#8f8ca4', fontSize: '0.82rem', marginTop: '4px' }}>
                SpecFlowAI parsed your story using <strong>{modeUsed}</strong>. Review the execution roadmap on the left and full workspace code/analytics on the right.
              </p>
            </div>
          </div>

          {/* Two-Column Side-by-Side Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '24px', alignItems: 'stretch' }}>
            
            {/* Left Column: Visual Step Roadmap */}
            <div className="saas-panel" style={{ padding: '24px', background: '#12111a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={18} color="var(--secondary)" />
                <span>Visual Roadmap Blueprint</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflowY: 'auto', maxHeight: '520px', paddingRight: '8px' }}>
                
                {/* Vertical connector line */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  bottom: '20px',
                  left: '26px',
                  width: '2px',
                  background: 'linear-gradient(180deg, var(--primary) 0%, rgba(192,179,245,0.08) 100%)',
                  zIndex: 0
                }} />

                {parsedSteps.length > 0 ? (
                  parsedSteps.map((step, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        alignItems: 'flex-start',
                        zIndex: 1
                      }}
                    >
                      {/* Step Icon circle */}
                      <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: '#0b0a10',
                        border: '1px solid rgba(192, 179, 245, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}>
                        {getActionIcon(step.action, step.expectation)}
                      </div>

                      {/* Step Details Card */}
                      <div className="hover-glow-card" style={{
                        flexGrow: 1,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(192, 179, 245, 0.05)',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontWeight: 'bold', 
                          color: step.keyword === 'Given' ? 'var(--secondary)' : step.keyword === 'When' ? '#22d3ee' : '#f472b6',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          alignSelf: 'flex-start'
                        }}>
                          {step.keyword}
                        </span>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                          {step.step}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#8f8ca4', fontSize: '0.85rem', padding: '20px', textAlign: 'center' }}>
                    No parsed steps found. Try re-generating from Step 1.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Code & Analytics Studio Console */}
            <div className="saas-panel" style={{ background: '#12111a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Studio Tab bar */}
              <div style={{ 
                background: '#09070f', 
                borderBottom: '1px solid rgba(192,179,245,0.06)',
                padding: '12px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'spec', label: 'Playwright Spec' },
                    { id: 'pom', label: 'Page Objects (POM)' },
                    { id: 'nlp', label: '🧠 NLP Parser Visualizer' },
                    { id: 'readme', label: '📝 README.md Preview' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStudioTab(tab.id as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: activeStudioTab === tab.id ? 'rgba(192,179,245,0.08)' : 'transparent',
                        color: activeStudioTab === tab.id ? 'var(--secondary)' : '#8f8ca4',
                        transition: 'all 0.2s',
                        borderBottom: activeStudioTab === tab.id ? '2px solid var(--secondary)' : '2px solid transparent'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ZIP Download button */}
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="btn btn-gradient"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.78rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {downloadingZip ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <span>📦 Export Full Suite (.ZIP)</span>
                  )}
                </button>
              </div>

              {/* Tab Content Window */}
              {activeStudioTab === 'spec' && (
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Metadata line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0e0d14', padding: '10px 20px', borderBottom: '1px solid rgba(192,179,245,0.04)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#8f8ca4', fontFamily: 'JetBrains Mono, monospace' }}>TYPESCRIPT (PLAYWRIGHT SPEC)</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-white" onClick={handleCopy} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        <span>Copy</span>
                      </button>
                      <button className="btn btn-white" onClick={handleDownloadSingleFile} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  {/* Code editor */}
                  <div style={{ 
                    flexGrow: 1, 
                    background: '#0b0a10', 
                    padding: '20px', 
                    fontFamily: 'JetBrains Mono, monospace', 
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                    overflow: 'auto',
                    maxHeight: '420px',
                    borderBottomLeftRadius: '16px',
                    borderBottomRightRadius: '16px'
                  }}>
                    <pre dangerouslySetInnerHTML={{ __html: highlightCode(generatedSpec.specCode, 'typescript') }} />
                  </div>
                </div>
              )}

              {activeStudioTab === 'pom' && (
                <div style={{ display: 'flex', flexGrow: 1, alignItems: 'stretch' }}>
                  
                  {/* Left Sidebar explorer list */}
                  <div style={{
                    width: '180px',
                    background: '#0e0d14',
                    borderRight: '1px solid rgba(192,179,245,0.06)',
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8f8ca4', letterSpacing: '0.05em' }}>FILES Explorer</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(192,179,245,0.05)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      color: 'var(--secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: '1px solid rgba(192,179,245,0.1)'
                    }}>
                      <FolderOpen size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {generatedSpec.pageFilename}
                      </span>
                    </div>
                  </div>

                  {/* Right editor panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: 'calc(100% - 180px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0e0d14', padding: '10px 20px', borderBottom: '1px solid rgba(192,179,245,0.04)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#8f8ca4', fontFamily: 'JetBrains Mono, monospace' }}>TYPESCRIPT (POM CLASS)</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-white" onClick={handleCopy} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                          <span>Copy</span>
                        </button>
                        <button className="btn btn-white" onClick={handleDownloadSingleFile} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ 
                      flexGrow: 1, 
                      background: '#0b0a10', 
                      padding: '20px', 
                      fontFamily: 'JetBrains Mono, monospace', 
                      fontSize: '0.82rem',
                      lineHeight: '1.5',
                      overflow: 'auto',
                      maxHeight: '420px'
                    }}>
                      <pre dangerouslySetInnerHTML={{ __html: highlightCode(generatedSpec.pageCode, 'typescript') }} />
                    </div>
                  </div>
                </div>
              )}

              {activeStudioTab === 'nlp' && (
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Metadata line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0e0d14', padding: '10px 20px', borderBottom: '1px solid rgba(192,179,245,0.04)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#8f8ca4', fontFamily: 'JetBrains Mono, monospace' }}>NLP PARSER VISUALIZER (PARSED METADATA)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--secondary)' }}>
                      <Info size={12} />
                      <span>Syntax Mapping complete</span>
                    </div>
                  </div>
                  
                  {/* Token Table */}
                  <div style={{ 
                    flexGrow: 1, 
                    background: '#0b0a10', 
                    padding: '20px', 
                    overflowY: 'auto',
                    maxHeight: '420px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(192, 179, 245, 0.08)', color: 'var(--secondary)', background: '#0b0a10' }}>
                          <th style={{ padding: '10px 8px', borderRadius: '8px 0 0 8px' }}>Step</th>
                          <th style={{ padding: '10px 8px' }}>Keyword</th>
                          <th style={{ padding: '10px 8px' }}>Text Content</th>
                          <th style={{ padding: '10px 8px' }}>Inferred Selector</th>
                          <th style={{ padding: '10px 8px', borderRadius: '0 8px 8px 0' }}>Automation Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pipelineTable.length > 0 ? pipelineTable : parsedSteps).map((step, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(192, 179, 245, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--primary)' }}>{`0${idx + 1}`}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 'bold', 
                                background: step.keyword === 'Given' ? 'rgba(124,58,237,0.12)' : step.keyword === 'When' ? 'rgba(6,182,212,0.12)' : 'rgba(236,72,153,0.12)',
                                color: step.keyword === 'Given' ? 'var(--secondary)' : step.keyword === 'When' ? '#22d3ee' : '#f472b6',
                                padding: '2px 6px',
                                borderRadius: '8px'
                              }}>
                                {step.keyword || step.Keyword}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px', color: '#ffffff' }}>{step.step || step.Text}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <code style={{ color: 'var(--secondary)' }}>{step.selector || step.InferredSelector}</code>
                            </td>
                            <td style={{ padding: '10px 8px', color: 'var(--secondary)', fontWeight: 600 }}>
                              <code>
                                {step.action === 'goto' || step.Action === 'goto' ? 'goto()' : 
                                 step.action === 'type' || step.action === 'fill' || step.Action === 'type' ? 'fill()' : 
                                 step.action === 'click' || step.Action === 'click' ? 'click()' : 
                                 step.expectation === 'url' || step.Expectation === 'url' ? 'toHaveURL()' : 
                                 step.expectation === 'visible' || step.Expectation === 'visible' ? 'toBeVisible()' : 
                                 'none'}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeStudioTab === 'readme' && (
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Metadata line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0e0d14', padding: '10px 20px', borderBottom: '1px solid rgba(192,179,245,0.04)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#8f8ca4', fontFamily: 'JetBrains Mono, monospace' }}>MARKDOWN (README.MD)</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-white" onClick={handleCopy} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        <span>Copy</span>
                      </button>
                      <button className="btn btn-white" onClick={handleDownloadSingleFile} style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  {/* Render content */}
                  <div style={{ 
                    flexGrow: 1, 
                    background: '#0b0a10', 
                    padding: '20px', 
                    overflowY: 'auto',
                    maxHeight: '420px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '0.85rem',
                    lineHeight: '1.6'
                  }}>
                    <pre 
                      style={{ 
                        fontFamily: 'JetBrains Mono, monospace', 
                        fontSize: '0.8rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }} 
                      dangerouslySetInnerHTML={{ __html: highlightCode(getReadmeContent(), 'markdown') }} 
                    />
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button 
              className="btn btn-white"
              onClick={() => setCurrentStep(1)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Step 1</span>
            </button>

            <button 
              className="btn btn-gradient"
              onClick={() => setCurrentStep(3)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
            >
              <span>Proceed to Run Test</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {currentStep === 3 && generatedSpec && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section info */}
          <div style={{ background: 'rgba(140, 122, 230, 0.03)', border: '1px solid rgba(140, 122, 230, 0.1)', padding: '16px 20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)' }}>Step 3: Watch Browser Run</h3>
            <p style={{ color: '#8f8ca4', fontSize: '0.82rem', marginTop: '4px', lineHeight: '1.4' }}>
              Observe live browser simulation on the left. The dynamic checklist tracks runner execution and checks off milestones as they complete.
            </p>
          </div>

          {/* Embedded runner */}
          <TestRunnerSimulator 
            generatedSpec={generatedSpec} 
            featureName={featureName}
            steps={parsedSteps}
          />

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button 
              className="btn btn-white"
              onClick={() => setCurrentStep(2)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Step 2</span>
            </button>

            <button 
              className="btn btn-white"
              onClick={() => {
                setCurrentStep(1);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
            >
              <span>Start New Scenario</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
