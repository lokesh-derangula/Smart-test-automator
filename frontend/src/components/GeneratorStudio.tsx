import { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  RefreshCw,
  Code2,
  FileCode
} from 'lucide-react';

interface GeneratorStudioProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onGenerated: (data: { gherkin: string; pageCode: string; pageFilename: string; specCode: string; specFilename: string }) => void;
}

export default function GeneratorStudio({ apiKey, setApiKey, onGenerated }: GeneratorStudioProps) {
  const [featureName, setFeatureName] = useState('User Login');
  const [story, setStory] = useState(
    'As a registered user\nI want to log in to my account\nSo that I can access my dashboard.'
  );
  const [criteria, setCriteria] = useState(
    '- The user is on the login page\n- The user enters "testuser" in the username field\n- The user enters "password123" in the password field\n- The user clicks the login button\n- The user should be redirected to the "/dashboard" page'
  );

  const [useOpenAI, setUseOpenAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'page' | 'spec'>('page');
  const [copied, setCopied] = useState(false);
  const [copiedGherkin, setCopiedGherkin] = useState(false);
  const [modeUsed, setModeUsed] = useState('');

  const [gherkin, setGherkin] = useState('');
  const [pageFilename, setPageFilename] = useState('LoginPage.ts');
  const [pageCode, setPageCode] = useState('');
  const [specFilename, setSpecFilename] = useState('login.spec.ts');
  const [specCode, setSpecCode] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

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
        /('[^']*')/g,
        '<span style="color: #34d399;">$1</span>'
      );
      escaped = escaped.replace(
        /(\/\/.*)/g,
        '<span style="color: #8f8ca4; font-style: italic;">$1</span>'
      );
    }
    return escaped;
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
        setGherkin(data.gherkin);
        setPageFilename(data.page_filename);
        setPageCode(data.page_code);
        setSpecFilename(data.spec_filename);
        setSpecCode(data.spec_code);
        setModeUsed(data.mode);
        setHasGenerated(true);
        
        onGenerated({
          gherkin: data.gherkin,
          pageCode: data.page_code,
          pageFilename: data.page_filename,
          specCode: data.spec_code,
          specFilename: data.spec_filename
        });
      } else {
        alert("Generation failed: " + data.detail);
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting API backend. Please ensure uvicorn server is running on localhost:8001.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = activeCodeTab === 'page' ? pageCode : specCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadGherkin = () => {
    const file_base = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'test';
    const filename = `${file_base}.feature`;
    
    fetch("http://127.0.0.1:8001/api/download/file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ filename, content: gherkin })
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
        const localBlob = new Blob([gherkin], { type: 'text/plain' });
        const localUrl = URL.createObjectURL(localBlob);
        const a = document.createElement('a');
        a.href = localUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(localUrl);
      });
  };

  const handleDownload = () => {
    const filename = activeCodeTab === 'page' ? pageFilename : specFilename;
    const content = activeCodeTab === 'page' ? pageCode : specCode;
    
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
        const localBlob = new Blob([content], { type: 'text/typescript' });
        const localUrl = URL.createObjectURL(localBlob);
        const a = document.createElement('a');
        a.href = localUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(localUrl);
      });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Test Generation Studio</h1>
        <p style={{ color: '#8f8ca4', fontSize: '0.95rem', marginTop: '4px' }}>
          Translate Agile user stories and criteria into Gherkin BDD scenarios and production-grade Page Object Model scripts.
        </p>
      </div>

      {/* Main double-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left Inputs panel */}
        <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Story & Criteria Input</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 600 }}>Feature Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={featureName} 
              onChange={(e) => setFeatureName(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 600 }}>User Story</label>
            <textarea 
              rows={3} 
              className="input-field" 
              value={story} 
              onChange={(e) => setStory(e.target.value)} 
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 600 }}>Acceptance Criteria</label>
            <textarea 
              rows={6} 
              className="input-field" 
              value={criteria} 
              onChange={(e) => setCriteria(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ borderTop: '1px solid rgba(192, 179, 245, 0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AI Inference Engine</span>
                <span style={{ fontSize: '0.72rem', color: '#8f8ca4' }}>Choose between local processing or GPT-4</span>
              </div>
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
                  Local Parser
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
            </div>

            {useOpenAI && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 600 }}>OpenAI API Key</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="sk-..." 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                />
              </div>
            )}
          </div>

          <button 
            className="btn btn-gradient" 
            onClick={handleGenerate}
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>Running NLP Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Compile & Generate Code</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {hasGenerated ? (
            <>
              {/* BDD Gherkin Box */}
              <div className="saas-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#12111a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code2 size={16} color="var(--secondary)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Gherkin BDD Feature</h3>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-white" onClick={() => {
                      navigator.clipboard.writeText(gherkin);
                      setCopiedGherkin(true);
                      setTimeout(() => setCopiedGherkin(false), 2000);
                    }} style={{ padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', height: '28px' }} title="Copy Gherkin">
                      {copiedGherkin ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                    <button className="btn btn-white" onClick={handleDownloadGherkin} style={{ padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', height: '28px' }} title="Download .feature File">
                      <Download size={12} />
                    </button>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', background: '#0b0a10', padding: '4px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(192, 179, 245, 0.05)' }}>
                      BDD Compiled
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  background: '#0b0a10', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  overflowX: 'auto',
                  border: '1px solid rgba(192, 179, 245, 0.05)',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  <pre dangerouslySetInnerHTML={{ __html: highlightCode(gherkin, 'gherkin') }} />
                </div>
              </div>

              {/* Playwright Script Code Box */}
              <div className="saas-panel" style={{ flexGrow: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '380px', background: '#12111a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(192, 179, 245, 0.05)', paddingBottom: '8px' }}>
                  {/* File Tabs */}
                  <div style={{ display: 'flex', gap: '4px' }}>
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
                        color: activeCodeTab === 'page' ? 'var(--secondary)' : '#8f8ca4',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FileCode size={14} />
                      {pageFilename}
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
                        color: activeCodeTab === 'spec' ? 'var(--secondary)' : '#8f8ca4',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Play size={12} />
                      {specFilename}
                    </button>
                  </div>
                  
                  {/* File actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-white" onClick={handleCopy} style={{ padding: '6px 10px', borderRadius: '6px' }} title="Copy Code">
                      {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                    <button className="btn btn-white" onClick={handleDownload} style={{ padding: '6px 10px', borderRadius: '6px' }} title="Download File">
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Code body */}
                <div style={{ 
                  background: '#0b0a10', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  overflow: 'auto',
                  border: '1px solid rgba(192, 179, 245, 0.05)',
                  flexGrow: 1,
                  maxHeight: '280px'
                }}>
                  <pre dangerouslySetInnerHTML={{ 
                    __html: highlightCode(activeCodeTab === 'page' ? pageCode : specCode, 'typescript') 
                  }} />
                </div>
                
                {/* Generation Mode Tag */}
                <div style={{ fontSize: '0.75rem', color: '#8f8ca4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Mode: {modeUsed}</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>POM Structure Optimized</span>
                </div>
              </div>
            </>
          ) : (
            <div className="saas-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px', minHeight: '400px', textAlign: 'center', background: '#12111a' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(192,179,245,0.05)',
                border: '1px solid rgba(192,179,245,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)'
              }}>
                <Code2 size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Awaiting Input Compilation</h3>
                <p style={{ color: '#8f8ca4', fontSize: '0.85rem', maxWidth: '300px', marginTop: '4px' }}>
                  Click "Compile & Generate Code" to run the NLP parsing model and build your automation suite.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
