import { 
  Sparkles, 
  Settings, 
  Database, 
  Play
} from 'lucide-react';

interface DashboardProps {
  onStart: () => void;
}

export default function Dashboard({ onStart }: DashboardProps) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Welcome Hero Typography Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '40px', alignItems: 'center' }}>
        
        {/* Left Side: Headline */}
        <div>
          <div className="nixt-brace-header" style={{ marginBottom: '12px' }}>{"}"} welcome to SpecFlowAI</div>
          <h1 className="nixt-hero-title" style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.15 }}>
            Create Test Scripts<br />
            Without Writing Code
          </h1>
          <p style={{ color: '#8f8ca4', fontSize: '1rem', marginTop: '16px', lineHeight: '1.6', maxWidth: '500px' }}>
            SpecFlowAI uses fine-tuned translation models to convert natural English descriptions into structured automated browser tests in seconds.
          </p>
        </div>

        {/* Right Side: Large CTA Card */}
        <div className="saas-panel animate-fade-in" style={{ 
          padding: '32px', 
          background: 'rgba(140, 122, 230, 0.03)', 
          border: '1px solid rgba(140, 122, 230, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          borderRadius: '28px',
          boxShadow: '0 10px 40px rgba(140, 122, 230, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--secondary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Magic Test Generator</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
            Type your requirements in plain English, inspect the auto-generated checklist map, and watch the mock browser run tests live.
          </p>
          <button className="btn btn-gradient" onClick={onStart} style={{ padding: '16px', display: 'flex', justifyContent: 'center', width: '100%', gap: '8px' }}>
            <span>Open Magic Studio ➔</span>
          </button>
        </div>
      </div>

      {/* Simplified High-level Overview Roadmap for Non-Technical Users */}
      <div className="saas-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#12111a' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>How does the Magic work?</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(192, 179, 245, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(192, 179, 245, 0.1)' }}>
              <span style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>1</span>
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Describe flow</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4' }}>Explain your website features in simple terms or load a ready-made template.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(192, 179, 245, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(192, 179, 245, 0.1)' }}>
              <span style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>2</span>
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Review visual map</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4' }}>AI parses your descriptions and creates an step-by-step interactive testing checklist map.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(192, 179, 245, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(192, 179, 245, 0.1)' }}>
              <span style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>3</span>
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Watch it run!</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4' }}>Watch automated web browser instances perform clicks, inputs, and verify outputs live.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(192, 179, 245, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(192, 179, 245, 0.1)' }}>
              <Database size={15} color="var(--secondary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Model Training</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4' }}>Fine-tune the local translation weights in the AI Data Studio with simple CSV spreadsheets.</p>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
