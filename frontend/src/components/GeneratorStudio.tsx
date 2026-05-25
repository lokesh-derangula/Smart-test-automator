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
  HelpCircle
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
  const [modeUsed, setModeUsed] = useState('Local NLP Engine');
  const [showTechnicalCode, setShowTechnicalCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'gherkin' | 'page' | 'spec'>('page');

  const [copied, setCopied] = useState(false);
  const [copiedGherkin, setCopiedGherkin] = useState(false);

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
    if (activeCodeTab === 'gherkin') textToCopy = generatedSpec.gherkin;
    else if (activeCodeTab === 'page') textToCopy = generatedSpec.pageCode;
    else if (activeCodeTab === 'spec') textToCopy = generatedSpec.specCode;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedSpec) return;
    let filename = '';
    let content = '';

    if (activeCodeTab === 'gherkin') {
      const file_base = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'test';
      filename = `${file_base}.feature`;
      content = generatedSpec.gherkin;
    } else if (activeCodeTab === 'page') {
      filename = generatedSpec.pageFilename;
      content = generatedSpec.pageCode;
    } else if (activeCodeTab === 'spec') {
      filename = generatedSpec.specFilename;
      content = generatedSpec.specCode;
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

  const highlightCode = (code: string, type: 'gherkin' | 'typescript') => {
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

  // Helper to map parsed actions to visual icons
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', height: '100%' }}>
      
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
            { step: 2, label: '2. Review Map' },
            { step: 3, label: '3. Run Browser' }
          ].map(s => (
            <button 
              key={s.step}
              onClick={() => {
                // Only allow switching to step 2 or 3 if spec has been generated
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
          
          {/* Section info */}
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
          
          {/* Section info */}
          <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '16px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>Step 2: Inspect AI Map</h3>
              <p style={{ color: '#8f8ca4', fontSize: '0.82rem', marginTop: '4px' }}>
                SpecFlowAI parsed your story using <strong>{modeUsed}</strong>. Review the step map below.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleDownload}
                className="btn btn-white" 
                style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Export Code</span>
              </button>
            </div>
          </div>

          {/* Interactive AI Roadmap - Steps visualization */}
          <div className="saas-panel" style={{ padding: '24px', background: '#12111a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Visual Automation Blueprint</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              
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
                      padding: '14px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold', 
                          color: step.keyword === 'Given' ? 'var(--secondary)' : step.keyword === 'When' ? '#22d3ee' : '#f472b6',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          alignSelf: 'flex-start'
                        }}>
                          {step.keyword}
                        </span>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                          {step.step}
                        </p>
                      </div>

                      {/* Technical detail badges */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {step.selector && (
                          <span style={{ fontSize: '0.72rem', background: '#0b0a10', border: '1px solid rgba(192,179,245,0.08)', padding: '4px 10px', borderRadius: '12px', color: '#d1cde4' }}>
                            Target: <code style={{ color: 'var(--secondary)' }}>{step.selector}</code>
                          </span>
                        )}
                        {step.action !== 'none' && (
                          <span style={{ fontSize: '0.72rem', background: '#0b0a10', border: '1px solid rgba(192,179,245,0.08)', padding: '4px 10px', borderRadius: '12px', color: '#d1cde4' }}>
                            Action: <code style={{ color: '#22d3ee' }}>{step.action}</code>
                          </span>
                        )}
                        {step.value && (
                          <span style={{ fontSize: '0.72rem', background: '#0b0a10', border: '1px solid rgba(192,179,245,0.08)', padding: '4px 10px', borderRadius: '12px', color: '#d1cde4' }}>
                            Value: <code style={{ color: '#34d399' }}>"{step.value}"</code>
                          </span>
                        )}
                      </div>
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

          {/* Accordion Collapsible for Technical Code blocks */}
          <div className="saas-panel" style={{ background: '#12111a', overflow: 'hidden' }}>
            <button 
              onClick={() => setShowTechnicalCode(!showTechnicalCode)}
              style={{
                width: '100%',
                background: '#09070f',
                border: 'none',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'between',
                cursor: 'pointer',
                color: 'white',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                <Code2 size={18} color="var(--secondary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Show Technical Code Blocks (For Developers)</span>
              </div>
              {showTechnicalCode ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {showTechnicalCode && (
              <div style={{ padding: '24px', borderTop: '1px solid rgba(192, 179, 245, 0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(192, 179, 245, 0.05)', paddingBottom: '10px' }}>
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => setActiveCodeTab('gherkin')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: activeCodeTab === 'gherkin' ? 'rgba(192,179,245,0.08)' : 'transparent',
                        color: activeCodeTab === 'gherkin' ? 'var(--secondary)' : '#8f8ca4'
                      }}
                    >
                      Feature Scenario
                    </button>
                    <button 
                      onClick={() => setActiveCodeTab('page')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: activeCodeTab === 'page' ? 'rgba(192,179,245,0.08)' : 'transparent',
                        color: activeCodeTab === 'page' ? 'var(--secondary)' : '#8f8ca4'
                      }}
                    >
                      {generatedSpec.pageFilename} (POM Page)
                    </button>
                    <button 
                      onClick={() => setActiveCodeTab('spec')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: activeCodeTab === 'spec' ? 'rgba(192,179,245,0.08)' : 'transparent',
                        color: activeCodeTab === 'spec' ? 'var(--secondary)' : '#8f8ca4'
                      }}
                    >
                      {generatedSpec.specFilename} (Spec Runner)
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-white" onClick={handleCopy} style={{ padding: '6px 10px', borderRadius: '6px' }} title="Copy Code">
                      {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                    <button className="btn btn-white" onClick={handleDownload} style={{ padding: '6px 10px', borderRadius: '6px' }} title="Download File">
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Code viewport */}
                <div style={{ 
                  background: '#0b0a10', 
                  borderRadius: '16px', 
                  padding: '20px', 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  overflow: 'auto',
                  border: '1px solid rgba(192, 179, 245, 0.05)',
                  maxHeight: '260px'
                }}>
                  <pre dangerouslySetInnerHTML={{ 
                    __html: highlightCode(
                      activeCodeTab === 'gherkin' ? generatedSpec.gherkin : (activeCodeTab === 'page' ? generatedSpec.pageCode : generatedSpec.specCode),
                      activeCodeTab === 'gherkin' ? 'gherkin' : 'typescript'
                    ) 
                  }} />
                </div>
              </div>
            )}
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
          <TestRunnerSimulator generatedSpec={generatedSpec} />

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
