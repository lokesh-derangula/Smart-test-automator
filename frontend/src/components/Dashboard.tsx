import { 
  FileText, 
  Terminal, 
  Layers, 
  Cpu, 
  Gauge
} from 'lucide-react';

interface MetricCardProps {
  value: string | number;
  label: string;
  subText: string;
}

function MetricCard({ value, label, subText }: MetricCardProps) {
  return (
    <div className="saas-panel" style={{ padding: '32px', flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#12111a' }}>
      <div className="giant-number">{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#8f8ca4', fontWeight: 500, letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', opacity: 0.8 }}>{subText}</div>
    </div>
  );
}

export default function Dashboard() {
  const lossHistory = [
    { epoch: 1, loss: 0.85, valLoss: 0.92 },
    { epoch: 2, loss: 0.42, valLoss: 0.49 },
    { epoch: 3, loss: 0.21, valLoss: 0.28 },
    { epoch: 4, loss: 0.09, valLoss: 0.14 },
    { epoch: 5, loss: 0.03, valLoss: 0.05 }
  ];

  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 30;

  const getCoordinates = (epoch: number, val: number) => {
    const x = padding + ((epoch - 1) / 4) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (val / 1.0) * (chartHeight - padding * 2);
    return { x, y };
  };

  const generatePath = (dataKey: 'loss' | 'valLoss') => {
    return lossHistory.map((d, i) => {
      const { x, y } = getCoordinates(d.epoch, d[dataKey]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* NixtNode Style Hero Typography Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
        
        {/* Left Side: Headline */}
        <div>
          <div className="nixt-brace-header" style={{ marginBottom: '8px' }}>{"}"} SpecFlowAI</div>
          <h1 className="nixt-hero-title">
            Is a Premier Test<br />
            Automation Pr
            {/* Custom Inline Orbital SVG for "o" */}
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative', 
              width: '46px', 
              height: '46px', 
              margin: '0 4px', 
              verticalAlign: 'middle' 
            }}>
              <svg width="46" height="46" viewBox="0 0 40 40" style={{ position: 'absolute', top: 0, left: 0 }}>
                <ellipse cx="20" cy="20" rx="19" ry="6" fill="none" stroke="var(--secondary)" strokeWidth="1.8" transform="rotate(40 20 20)" />
                <ellipse cx="20" cy="20" rx="19" ry="6" fill="none" stroke="var(--secondary)" strokeWidth="1.8" transform="rotate(-40 20 20)" />
                <circle cx="20" cy="20" r="4.5" fill="#ffffff" />
              </svg>
            </span>
            vider
          </h1>
        </div>

        {/* Right Side: Description + Monospace Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{ color: '#8f8ca4', fontSize: '0.98rem', lineHeight: '1.6' }}>
            <span style={{ color: 'var(--secondary)' }}>{"}"}</span> Powered by fine-tuned T5 models to analyze stories, clean acceptance criteria, compile Gherkin scenarios, and generate parallel Playwright scripts.
          </p>
          <div>
            <button className="btn btn-white" onClick={() => alert("Automation suite initiated.")} style={{ padding: '14px 32px' }}>
              Execute Suite
            </button>
          </div>
        </div>
      </div>

      {/* NixtNode Style Stats Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <MetricCard 
          value="128" 
          label="USER STORIES TOKENIZED" 
          subText="100% processing pipeline coverage"
        />
        <MetricCard 
          value="412" 
          label="PLAYWRIGHT SPECS COMPILED" 
          subText="Dynamic page object structures"
        />
        <MetricCard 
          value="96.8%" 
          label="NLP MODEL CONFIDENCE" 
          subText="Based on fine-tuned T5 tokens"
        />
        <MetricCard 
          value="1.2s" 
          label="AVG. PARALLEL RUN TIME" 
          subText="Distributed chromium/firefox runs"
        />
      </div>

      {/* Detail workspaces (Loss Chart & Pipeline nodes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Model Loss Metrics */}
        <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Model Core Loss Optimization</h3>
            <p style={{ color: '#8f8ca4', fontSize: '0.8rem' }}>Training loss vs. validation epochs for T5 translation pipelines</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', background: '#0b0a10', borderRadius: '20px', padding: '16px', border: '1px solid rgba(192, 179, 245, 0.04)' }}>
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
              {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => {
                const y = chartHeight - padding - v * (chartHeight - padding * 2);
                return (
                  <g key={i}>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(192, 179, 245, 0.03)" strokeDasharray="3,3" />
                    <text x={padding - 8} y={y + 4} fill="#8f8ca4" fontSize="9" textAnchor="end">{v}</text>
                  </g>
                );
              })}
              {lossHistory.map((d, i) => {
                const x = padding + (i / 4) * (chartWidth - padding * 2);
                return (
                  <text key={i} x={x} y={chartHeight - 8} fill="#8f8ca4" fontSize="9" textAnchor="middle">
                    Ep {d.epoch}
                  </text>
                );
              })}
              <path d={generatePath('loss')} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
              <path d={generatePath('valLoss')} fill="none" stroke="var(--secondary)" strokeWidth="2.5" strokeDasharray="4,4" strokeLinecap="round" />
              
              {lossHistory.map((d, i) => {
                const p1 = getCoordinates(d.epoch, d.loss);
                const p2 = getCoordinates(d.epoch, d.valLoss);
                return (
                  <g key={i}>
                    <circle cx={p1.x} cy={p1.y} r="5" fill="var(--primary)" stroke="#12111a" strokeWidth="1.5" />
                    <circle cx={p2.x} cy={p2.y} r="4" fill="var(--secondary)" stroke="#12111a" strokeWidth="1.5" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
              <span style={{ color: '#8f8ca4', fontWeight: 500 }}>Training Loss</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', border: '1px dashed var(--secondary)', background: 'transparent', display: 'inline-block' }}></span>
              <span style={{ color: '#8f8ca4', fontWeight: 500 }}>Validation Loss</span>
            </div>
          </div>
        </div>

        {/* Pipelines Stages Card */}
        <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Active NLP Preprocessing Pipeline</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: '1. Tokenization & POS Tagging', desc: 'Identify syntax patterns and tokenize noun-verb groups', status: 'Optimal', color: 'var(--success)' },
              { name: '2. Gherkin Semantic Mapping', desc: 'Translates natural language statements into Given-When-Then blocks', status: 'Optimal', color: 'var(--success)' },
              { name: '3. Locator Mapping Engine', desc: 'Infers elements (inputs, buttons, overlays) and assigns selector names', status: 'Optimal', color: 'var(--success)' },
              { name: '4. POM Script Generator', desc: 'Compiles clean TS Page Object Models and standard Playwright specs', status: 'Optimal', color: 'var(--success)' }
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0b0a10', borderRadius: '16px', border: '1px solid rgba(192, 179, 245, 0.03)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{step.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8f8ca4', marginTop: '2px' }}>{step.desc}</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: step.color, background: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: '20px' }}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parallel Execution Insights */}
      <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Parallel Execution Speedups (Playwright Runner)</h3>
        <p style={{ color: '#8f8ca4', fontSize: '0.88rem', lineHeight: '1.5' }}>
          Distributed automation running results. Spawning Playwright workers in parallel reduces test build cycles compared to sequential Selenium/Jest executions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '8px' }}>
          <div style={{ background: '#0b0a10', padding: '18px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(192, 179, 245, 0.03)' }}>
            <Gauge size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8f8ca4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Avg. Parallel Test Run</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>1.2s <span style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 500 }}>(3 Workers)</span></div>
            </div>
          </div>

          <div style={{ background: '#0b0a10', padding: '18px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(192, 179, 245, 0.03)' }}>
            <Gauge size={32} color="var(--danger)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8f8ca4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Avg. Sequential Test Run</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>3.8s <span style={{ fontSize: '0.8rem', color: '#8f8ca4', fontWeight: 500 }}>(Single Worker)</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
