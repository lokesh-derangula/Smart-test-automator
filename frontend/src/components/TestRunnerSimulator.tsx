import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Terminal, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  CheckCircle,
  Activity
} from 'lucide-react';

interface LogItem {
  worker: string;
  msg: string;
}

interface TestRunnerSimulatorProps {
  generatedSpec: {
    specFilename: string;
    specCode: string;
    pageCode: string;
  } | null;
}

export default function TestRunnerSimulator({ generatedSpec }: TestRunnerSimulatorProps) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [browserState, setBrowserState] = useState<'blank' | 'login' | 'typing_user' | 'typing_pass' | 'submitting' | 'dashboard'>('blank');
  const [typedUser, setTypedUser] = useState('');
  const [typedPass, setTypedPass] = useState('');
  
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  const runSuite = () => {
    setRunning(true);
    setLogs([]);
    setBrowserUrl('about:blank');
    setBrowserState('blank');
    setTypedUser('');
    setTypedPass('');

    const eventSource = new EventSource('http://127.0.0.1:8001/api/run-test-stream');

    eventSource.onmessage = (event) => {
      const log: LogItem = JSON.parse(event.data);
      setLogs(prev => [...prev, log]);

      const msg = log.msg.toLowerCase();
      
      // Update mock browser state based on real Playwright runtime events
      if (msg.includes('navigating') || msg.includes('goto') || msg.includes('page.goto')) {
        setBrowserUrl('https://example.com/login');
        setBrowserState('login');
      } else if (msg.includes('typing') || msg.includes('fill') || msg.includes('username')) {
        setBrowserState('typing_user');
        setTypedUser('testuser');
      } else if (msg.includes('password') || msg.includes('secure')) {
        setBrowserState('typing_pass');
        setTypedPass('•••••••••••');
      } else if (msg.includes('click') || msg.includes('submit')) {
        setBrowserState('submitting');
      } else if (msg.includes('passed') || msg.includes('success') || msg.includes('dashboard')) {
        setTimeout(() => {
          setBrowserUrl('https://example.com/dashboard');
          setBrowserState('dashboard');
        }, 300);
      }

      // Automatically stop runner when process completes or all tests pass
      if (msg.includes('finished') || msg.includes('exited with code') || (msg.includes('passed') && msg.includes('('))) {
        setTimeout(() => {
          eventSource.close();
          setRunning(false);
        }, 1000);
      }
    };

    eventSource.onerror = (err) => {
      console.error(err);
      eventSource.close();
      setRunning(false);
      setLogs(prev => [...prev, { worker: 'system', msg: 'Execution stream failed. Ensure backend is running.' }]);
    };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Playwright Parallel Test Runner</h1>
        <p style={{ color: '#8f8ca4', fontSize: '0.95rem', marginTop: '4px' }}>
          Simulate parallel Playwright test execution on Chromium, Firefox, and WebKit threads directly.
        </p>
      </div>

      {generatedSpec ? (
        <div style={{ 
          fontSize: '0.82rem', 
          background: 'rgba(16, 185, 129, 0.08)', 
          border: '1px solid rgba(16, 185, 129, 0.15)', 
          padding: '12px 18px', 
          borderRadius: '14px',
          color: '#34d399',
          fontWeight: 600
        }}>
          Loaded Test Spec: <strong>{generatedSpec.specFilename}</strong> (POM structure mapped successfully)
        </div>
      ) : (
        <div style={{ 
          fontSize: '0.82rem', 
          background: 'rgba(192, 179, 245, 0.05)', 
          border: '1px solid rgba(192, 179, 245, 0.1)', 
          padding: '12px 18px', 
          borderRadius: '14px',
          color: 'var(--secondary)',
          fontWeight: 600
        }}>
          No custom spec compiled yet. Generating scripts in **Test Gen Studio** will link tests here. Running demo now.
        </div>
      )}

      {/* Main Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left: Mock Browser */}
        <div className="saas-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '420px', background: '#12111a' }}>
          {/* Header Bar */}
          <div style={{ 
            background: '#09070f', 
            padding: '12px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            borderBottom: '1px solid rgba(192, 179, 245, 0.04)' 
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }} />
            </div>

            <div style={{ display: 'flex', gap: '4px', color: 'var(--text-muted)' }}>
              <ChevronLeft size={16} />
              <ChevronRight size={16} />
              <RotateCw size={14} style={{ marginLeft: '4px' }} />
            </div>

            <div style={{
              flexGrow: 1,
              background: '#12111a',
              border: '1px solid rgba(192, 179, 245, 0.08)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Globe size={12} color="var(--success)" />
              <span>{browserUrl}</span>
            </div>

            <span style={{ 
              fontSize: '0.72rem', 
              color: 'var(--secondary)',
              background: 'rgba(255,255,255,0.03)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {running && <Activity size={10} className="animate-spin" />}
              {running ? 'Executing' : 'Standby'}
            </span>
          </div>

          {/* Web page area */}
          <div style={{ 
            flexGrow: 1, 
            background: '#0b0a10', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '24px',
            position: 'relative'
          }}>
            
            {browserState === 'blank' && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Globe size={48} style={{ margin: '0 auto 12px', opacity: 0.15 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Browser Session Inactive</span>
              </div>
            )}

            {(browserState === 'login' || browserState === 'typing_user' || browserState === 'typing_pass' || browserState === 'submitting') && (
              <div className="saas-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '280px', background: '#12111a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', color: '#ffffff' }}>Portal Log In</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: '#8f8ca4', fontWeight: 600 }}>Username</label>
                  <input 
                    type="text" 
                    readOnly
                    value={typedUser} 
                    className="input-field"
                    style={{ 
                      padding: '8px 12px', 
                      fontSize: '0.8rem',
                      borderColor: browserState === 'typing_user' ? 'var(--secondary)' : 'rgba(192,179,245,0.08)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: '#8f8ca4', fontWeight: 600 }}>Password</label>
                  <input 
                    type="text" 
                    readOnly
                    value={typedPass} 
                    className="input-field"
                    style={{ 
                      padding: '8px 12px', 
                      fontSize: '0.8rem',
                      borderColor: browserState === 'typing_pass' ? 'var(--secondary)' : 'rgba(192,179,245,0.08)'
                    }}
                  />
                </div>

                <button 
                  className="btn btn-white" 
                  disabled 
                  style={{ 
                    padding: '10px', 
                    fontSize: '0.8rem',
                    boxShadow: 'none',
                    opacity: browserState === 'submitting' ? 0.75 : 1
                  }}
                >
                  {browserState === 'submitting' ? 'Logging in...' : 'Sign In'}
                </button>
              </div>
            )}

            {browserState === 'dashboard' && (
              <div className="saas-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '340px', background: '#12111a', borderColor: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(16,185,129,0.05)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'var(--success)' }}>
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Welcome, testuser!</h3>
                  <p style={{ color: '#8f8ca4', fontSize: '0.78rem', marginTop: '4px' }}>Successfully redirected to your customer dashboard.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#0b0a10', padding: '12px', borderRadius: '12px', border: '1px solid rgba(192,179,245,0.04)' }}>
                  <div style={{ fontSize: '0.72rem' }}>
                    <div style={{ color: '#8f8ca4', fontWeight: 500 }}>Status</div>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>Active</div>
                  </div>
                  <div style={{ fontSize: '0.72rem' }}>
                    <div style={{ color: '#8f8ca4', fontWeight: 500 }}>Balance</div>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>$1,240.00</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Terminal Logs */}
        <div className="saas-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '420px', overflow: 'hidden', background: '#12111a' }}>
          <div style={{ 
            background: '#09070f', 
            padding: '12px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            borderBottom: '1px solid rgba(192,179,245,0.04)' 
          }}>
            <Terminal size={16} color="var(--secondary)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Playwright Parallel Log Streams</h3>
          </div>

          <div 
            ref={logTerminalRef}
            style={{ 
              flexGrow: 1, 
              background: '#0b0a10', 
              padding: '20px', 
              fontFamily: 'JetBrains Mono, monospace', 
              fontSize: '0.8rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px'
            }}
          >
            {logs.length === 0 && (
              <div style={{ color: '#8f8ca4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>&gt;_ Click run below to view active Playwright test runner logs...</span>
              </div>
            )}
            
            {logs.map((item, idx) => {
              let prefixColor = '#8f8ca4';
              let textColor = '#8f8ca4';
              
              if (item.worker === 'chromium') {
                prefixColor = '#a78bfa';
                textColor = '#ffffff';
              } else if (item.worker === 'firefox') {
                prefixColor = '#fb923c';
                textColor = '#ffffff';
              } else if (item.worker === 'webkit') {
                prefixColor = '#f472b6';
                textColor = '#ffffff';
              } else if (item.worker === 'system') {
                prefixColor = '#34d399';
                textColor = '#a7f3d0';
              }

              return (
                <div key={idx} style={{ display: 'flex', gap: '8px', lineHeight: '1.4' }}>
                  <span style={{ color: prefixColor, fontWeight: 'bold', flexShrink: 0 }}>
                    [{item.worker.toUpperCase()}]
                  </span>
                  <span style={{ color: textColor }}>{item.msg}</span>
                </div>
              );
            })}
          </div>

          <div style={{ 
            padding: '16px', 
            background: '#09070f', 
            borderTop: '1px solid rgba(192, 179, 245, 0.04)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <button 
              className="btn btn-white" 
              onClick={runSuite}
              disabled={running}
              style={{ flexGrow: 1 }}
            >
              <Play size={16} />
              <span>Execute Playwright Suite (Parallel)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
