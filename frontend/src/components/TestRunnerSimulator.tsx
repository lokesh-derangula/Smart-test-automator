import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Terminal, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  CheckCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ShoppingBag,
  UserPlus,
  LogIn,
  Layers
} from 'lucide-react';
import { API_URL } from '../config';

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
  featureName?: string;
  steps?: any[];
}

export default function TestRunnerSimulator({ generatedSpec, featureName = "User Login", steps = [] }: TestRunnerSimulatorProps) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [browserState, setBrowserState] = useState<'blank' | 'login' | 'typing_user' | 'typing_pass' | 'submitting' | 'dashboard'>('blank');
  const [typedUser, setTypedUser] = useState('');
  const [typedPass, setTypedPass] = useState('');
  
  // Checklist dynamic checked step index
  const [checkedCount, setCheckedCount] = useState(0);

  const [showRawLogs, setShowRawLogs] = useState(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Dynamic flow determination based on featureName
  const getFlowType = () => {
    const name = featureName.toLowerCase();
    if (name.includes('signup') || name.includes('register') || name.includes('registration')) {
      return 'signup';
    }
    if (name.includes('cart') || name.includes('checkout') || name.includes('purchase') || name.includes('shop') || name.includes('order')) {
      return 'cart';
    }
    return 'login'; // default
  };

  const flowType = getFlowType();

  // Fallback default checklist steps if none compiled yet
  const getDefaultSteps = () => {
    if (flowType === 'signup') {
      return [
        { keyword: 'Given', step: 'the user is on the signup page', action: 'goto', expectation: 'none' },
        { keyword: 'When', step: 'the user enters a new email address', action: 'type', expectation: 'none' },
        { keyword: 'And', step: 'enters a secure password and confirms it', action: 'type', expectation: 'none' },
        { keyword: 'And', step: 'clicks the "Sign Up" button', action: 'click', expectation: 'none' },
        { keyword: 'Then', step: 'the user should see the welcome banner', action: 'none', expectation: 'visible' }
      ];
    }
    if (flowType === 'cart') {
      return [
        { keyword: 'Given', step: 'the user is on the product detail page', action: 'goto', expectation: 'none' },
        { keyword: 'When', step: 'the user clicks the "Add to Cart" button', action: 'click', expectation: 'none' },
        { keyword: 'And', step: 'clicks the "Checkout" button', action: 'click', expectation: 'none' },
        { keyword: 'And', step: 'enters "123 Main St" in the shipping address', action: 'type', expectation: 'none' },
        { keyword: 'Then', step: 'the user should see the order confirmation details', action: 'none', expectation: 'visible' }
      ];
    }
    return [
      { keyword: 'Given', step: 'the user is on the login page', action: 'goto', expectation: 'none' },
      { keyword: 'When', step: 'the user enters "testuser" in username field', action: 'type', expectation: 'none' },
      { keyword: 'And', step: 'enters "password123" in password field', action: 'type', expectation: 'none' },
      { keyword: 'And', step: 'clicks the login button', action: 'click', expectation: 'none' },
      { keyword: 'Then', step: 'the user should be redirected to the dashboard', action: 'none', expectation: 'url' }
    ];
  };

  const activeStepsList = steps && steps.length > 0 ? steps : getDefaultSteps();

  const getStartUrl = () => {
    if (flowType === 'signup') return 'https://example.com/signup';
    if (flowType === 'cart') return 'https://example.com/shop/product/headphones';
    return 'https://example.com/login';
  };

  const getRedirectUrl = () => {
    if (flowType === 'signup') return 'https://example.com/dashboard?welcome=newuser';
    if (flowType === 'cart') return 'https://example.com/shop/checkout/confirmation';
    return 'https://example.com/dashboard';
  };

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Keep state reset when steps or generatedSpec changes
  useEffect(() => {
    setBrowserUrl('about:blank');
    setBrowserState('blank');
    setTypedUser('');
    setTypedPass('');
    setCheckedCount(0);
  }, [featureName, generatedSpec]);

  const runSuite = () => {
    setRunning(true);
    setLogs([]);
    setBrowserUrl('about:blank');
    setBrowserState('blank');
    setTypedUser('');
    setTypedPass('');
    setCheckedCount(0);

    const eventSource = new EventSource(`${API_URL}/api/run-test-stream`);

    eventSource.onmessage = (event) => {
      const log: LogItem = JSON.parse(event.data);
      setLogs(prev => [...prev, log]);

      const msg = log.msg.toLowerCase();
      
      // Update checklist progress and browser states dynamically
      if (msg.includes('navigating') || msg.includes('goto') || msg.includes('page.goto')) {
        setBrowserUrl(getStartUrl());
        setBrowserState('login');
        advanceChecklist('goto');
      } else if (msg.includes('typing') || msg.includes('fill') || msg.includes('username') || msg.includes('email') || msg.includes('address') || msg.includes('password')) {
        if (msg.includes('username') || msg.includes('email') || msg.includes('emailinput')) {
          setBrowserState('typing_user');
          setTypedUser(flowType === 'signup' ? 'newuser@example.com' : 'testuser');
          advanceChecklist('type');
        } else if (msg.includes('password') || msg.includes('passwordinput')) {
          setBrowserState('typing_pass');
          setTypedPass('•••••••••••');
          advanceChecklist('type');
        } else {
          // address or fallback input fields
          setBrowserState('typing_user');
          setTypedUser(flowType === 'cart' ? '123 Main St' : 'testuser');
          advanceChecklist('type');
        }
      } else if (msg.includes('click') || msg.includes('submit') || msg.includes('add to cart') || msg.includes('checkout')) {
        setBrowserState('submitting');
        advanceChecklist('click');
      } else if (msg.includes('passed') || msg.includes('success') || msg.includes('dashboard') || msg.includes('confirmation')) {
        setBrowserUrl(getRedirectUrl());
        setBrowserState('dashboard');
        setCheckedCount(activeStepsList.length); // complete all checklist items
      }

      // Automatically stop runner when process completes
      if (msg.includes('finished') || msg.includes('exited with code') || (msg.includes('passed') && msg.includes('('))) {
        setTimeout(() => {
          eventSource.close();
          setRunning(false);
          setCheckedCount(activeStepsList.length);
        }, 1000);
      }
    };

    eventSource.onerror = (err) => {
      console.error(err);
      eventSource.close();
      setRunning(false);
      setLogs(prev => {
        const hasFinished = prev.some(l => l.msg.toLowerCase().includes('finished') || l.msg.toLowerCase().includes('exited with code'));
        if (hasFinished) return prev;
        return [...prev, { worker: 'system', msg: 'Execution stream failed. Ensure backend is running.' }];
      });
    };
  };

  const advanceChecklist = (actionType: 'goto' | 'type' | 'click') => {
    setCheckedCount(prev => {
      // Find the next unchecked step that corresponds to this action
      for (let i = prev; i < activeStepsList.length; i++) {
        const step = activeStepsList[i];
        const stepAction = (step.action || step.Action || '').toLowerCase();
        
        // If the action matches, check up to this step
        if (stepAction === actionType || (actionType === 'type' && stepAction === 'fill')) {
          return i + 1;
        }
      }
      // Fallback: just advance by 1 step if actions don't map cleanly
      return Math.min(prev + 1, activeStepsList.length);
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Dynamic Spec Loaded Tag */}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Left: Mock Browser */}
        <div className="saas-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '400px', background: '#12111a' }}>
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

          {/* Web page area rendering dynamic screens based on Flow Type */}
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

            {/* FLOW 1: LOGIN FLOW */}
            {flowType === 'login' && (browserState === 'login' || browserState === 'typing_user' || browserState === 'typing_pass' || browserState === 'submitting') && (
              <div className="saas-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '280px', background: '#12111a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <LogIn size={16} color="var(--secondary)" />
                  <span>Portal Log In</span>
                </h3>
                
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

            {flowType === 'login' && browserState === 'dashboard' && (
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

            {/* FLOW 2: SIGNUP FLOW */}
            {flowType === 'signup' && (browserState === 'login' || browserState === 'typing_user' || browserState === 'typing_pass' || browserState === 'submitting') && (
              <div className="saas-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '280px', background: '#12111a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <UserPlus size={16} color="var(--secondary)" />
                  <span>Create Account</span>
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: '#8f8ca4', fontWeight: 600 }}>Email Address</label>
                  <input 
                    type="text" 
                    readOnly
                    value={typedUser} 
                    placeholder="name@domain.com"
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: '#8f8ca4', fontWeight: 600 }}>Confirm Password</label>
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
                  {browserState === 'submitting' ? 'Creating account...' : 'Register Account'}
                </button>
              </div>
            )}

            {flowType === 'signup' && browserState === 'dashboard' && (
              <div className="saas-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '340px', background: '#12111a', borderColor: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(16,185,129,0.05)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'var(--success)' }}>
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>🎉 Account Created!</h3>
                  <p style={{ color: '#8f8ca4', fontSize: '0.78rem', marginTop: '6px' }}>Your new profile is fully registered and activated.</p>
                </div>
                <div style={{ background: '#0b0a10', padding: '12px', borderRadius: '12px', border: '1px solid rgba(192,179,245,0.04)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8f8ca4' }}>Member Level:</span>
                    <strong style={{ color: 'var(--secondary)' }}>Free Starter Tier</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8f8ca4' }}>Username ID:</span>
                    <strong style={{ color: '#ffffff' }}>newuser@example.com</strong>
                  </div>
                </div>
              </div>
            )}

            {/* FLOW 3: CART CHECKOUT FLOW */}
            {flowType === 'cart' && (browserState === 'login' || browserState === 'typing_user' || browserState === 'typing_pass' || browserState === 'submitting') && (
              <div className="saas-panel animate-fade-in" style={{ padding: '20px', width: '100%', maxWidth: '300px', background: '#12111a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
                  <ShoppingBag size={16} color="var(--secondary)" />
                  <span>SaaS Store Checkout</span>
                </h3>
                
                {/* Product Detail Stage */}
                {(browserState === 'login') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ height: '80px', borderRadius: '12px', background: 'rgba(192,179,245,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={32} color="var(--secondary)" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Wireless Headphones XL</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 800 }}>$49.99</span>
                    <button className="btn btn-white" disabled style={{ padding: '8px', fontSize: '0.75rem' }}>Add to Cart</button>
                  </div>
                )}

                {/* Cart View Stage */}
                {(browserState === 'typing_user' && typedUser !== '123 Main St') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: '#0b0a10', padding: '10px', borderRadius: '10px' }}>
                      <span>Wireless Headphones</span>
                      <strong>$49.99 (1x)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                      <span>Total:</span>
                      <span style={{ color: 'var(--success)' }}>$49.99</span>
                    </div>
                    <button className="btn btn-gradient" disabled style={{ padding: '8px', fontSize: '0.75rem', width: '100%' }}>Checkout ➔</button>
                  </div>
                )}

                {/* Address Input Stage */}
                {((browserState === 'typing_user' && typedUser === '123 Main St') || browserState === 'typing_pass' || browserState === 'submitting') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.7rem', color: '#8f8ca4', fontWeight: 600 }}>Shipping Address</label>
                      <input 
                        type="text" 
                        readOnly
                        value={typedUser === '123 Main St' ? typedUser : '123 Main St'} 
                        placeholder="Enter street address"
                        className="input-field"
                        style={{ padding: '8px', fontSize: '0.75rem', borderColor: 'var(--secondary)' }}
                      />
                    </div>
                    
                    <button 
                      className="btn btn-gradient" 
                      disabled 
                      style={{ 
                        padding: '10px', 
                        fontSize: '0.75rem',
                        opacity: browserState === 'submitting' ? 0.75 : 1
                      }}
                    >
                      {browserState === 'submitting' ? 'Processing Order...' : 'Place Order'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {flowType === 'cart' && browserState === 'dashboard' && (
              <div className="saas-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '340px', background: '#12111a', borderColor: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(16,185,129,0.05)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'var(--success)' }}>
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>✅ Order Confirmed!</h3>
                  <p style={{ color: '#8f8ca4', fontSize: '0.78rem', marginTop: '6px' }}>Thank you for your purchase. Your transaction completed successfully.</p>
                </div>
                <div style={{ background: '#0b0a10', padding: '12px', borderRadius: '12px', border: '1px solid rgba(192,179,245,0.04)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8f8ca4' }}>Order Reference ID:</span>
                    <strong style={{ color: '#ffffff' }}>#SPF-99482</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8f8ca4' }}>Delivery Speed:</span>
                    <strong style={{ color: 'var(--success)' }}>3-5 Business Days</strong>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Step-by-Step Testing Checklist */}
        <div className="saas-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '400px', background: '#12111a', padding: '24px', justifySelf: 'stretch' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--secondary)" />
            <span>Live Automation Checklist</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
            
            {activeStepsList.map((step, idx) => {
              const isChecked = idx < checkedCount;
              const isCurrent = idx === checkedCount && running;
              
              return (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }} className="animate-fade-in">
                  <div style={{ marginTop: '2px' }}>
                    {isChecked ? (
                      <CheckCircle2 size={18} color="var(--success)" className="animate-fade-in" />
                    ) : isCurrent ? (
                      <Activity size={16} color="var(--secondary)" className="animate-spin" />
                    ) : (
                      <Circle size={16} color="#4a475a" />
                    )}
                  </div>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700, 
                      color: isChecked ? '#ffffff' : (isCurrent ? 'var(--secondary)' : '#8f8ca4'),
                      textDecoration: isChecked ? 'line-through' : 'none',
                      opacity: isChecked ? 0.75 : 1
                    }}>
                      <span style={{ 
                        color: step.keyword === 'Given' ? 'var(--secondary)' : step.keyword === 'When' ? '#22d3ee' : '#f472b6', 
                        fontWeight: 'bold',
                        marginRight: '6px'
                      }}>
                        {step.keyword}
                      </span>
                      {step.step}
                    </h4>
                  </div>
                </div>
              );
            })}

          </div>

          <button 
            className="btn btn-gradient" 
            onClick={runSuite}
            disabled={running}
            style={{ width: '100%', marginTop: '20px', padding: '12px' }}
          >
            <Play size={16} />
            <span>{running ? 'Test Execution Active...' : 'Launch Playwright Suite'}</span>
          </button>
        </div>
      </div>

      {/* Accordion Collapsible for Raw Terminal Logs */}
      <div className="saas-panel" style={{ background: '#12111a', overflow: 'hidden' }}>
        <button 
          onClick={() => setShowRawLogs(!showRawLogs)}
          style={{
            width: '100%',
            background: '#09070f',
            border: 'none',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            cursor: 'pointer',
            color: 'white',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
            <Terminal size={16} color="var(--secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Show Raw Playwright Terminal Logs (Developer Mode)</span>
          </div>
          {showRawLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showRawLogs && (
          <div 
            ref={logTerminalRef}
            style={{ 
              background: '#0b0a10', 
              padding: '20px', 
              fontFamily: 'JetBrains Mono, monospace', 
              fontSize: '0.78rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '220px',
              borderTop: '1px solid rgba(192, 179, 245, 0.05)'
            }}
          >
            {logs.length === 0 && (
              <div style={{ color: '#8f8ca4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>&gt;_ Playwright terminal is quiet. Start execution above to capture CLI outputs...</span>
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
        )}
      </div>

    </div>
  );
}
