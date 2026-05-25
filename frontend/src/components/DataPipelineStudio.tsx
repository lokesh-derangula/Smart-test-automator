import { useState } from 'react';
import { 
  Cpu, 
  Upload, 
  Settings2,
  Table,
  Activity,
  Database
} from 'lucide-react';

interface DataPipelineStudioProps {
  pipelineData: Array<any>;
}

export default function DataPipelineStudio({ pipelineData }: DataPipelineStudioProps) {
  const [epochs, setEpochs] = useState(5);
  const [datasetSize, setDatasetSize] = useState(150);
  const [training, setTraining] = useState(false);
  const [trainLogs, setTrainLogs] = useState<Array<any>>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Idle');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvRowsCount, setCsvRowsCount] = useState(0);

  const defaultTokens = [
    { StepID: "STEP_01", Keyword: "Given", Text: "the user is on the login page", Tokens: "['the', 'user', 'is', 'on', 'the', 'login', 'page']", POSTags: "[('the', 'DET'), ('user', 'NOUN'), ('is', 'VERB'), ('on', 'ADJ/ADV/PROPN'), ('the', 'DET'), ('login', 'NOUN'), ('page', 'NOUN')]", InferredSelector: "login page", Variable: "loginPage", Action: "goto", Value: "https://example.com/login", Expectation: "none" },
    { StepID: "STEP_02", Keyword: "When", Text: "the user enters valid credentials", Tokens: "['the', 'user', 'enters', 'valid', 'credentials']", POSTags: "[('the', 'DET'), ('user', 'NOUN'), ('enters', 'VERB'), ('valid', 'ADJ/ADV/PROPN'), ('credentials', 'NOUN')]", InferredSelector: "username field", Variable: "usernameField", Action: "type", Value: "testuser", Expectation: "none" },
    { StepID: "STEP_03", Keyword: "And", Text: "clicks the login button", Tokens: "['clicks', 'the', 'login', 'button']", POSTags: "[('clicks', 'VERB'), ('the', 'DET'), ('login', 'NOUN'), ('button', 'NOUN')]", InferredSelector: "login button", Variable: "loginButton", Action: "click", Value: "", Expectation: "none" },
    { StepID: "STEP_04", Keyword: "Then", Text: "the user should be redirected to the dashboard", Tokens: "['the', 'user', 'should', 'be', 'redirected', 'to', 'the', 'dashboard']", POSTags: "[('the', 'DET'), ('user', 'NOUN'), ('should', 'VERB'), ('be', 'VERB'), ('redirected', 'VERB'), ('to', 'ADJ/ADV/PROPN'), ('the', 'DET'), ('dashboard', 'NOUN')]", InferredSelector: "dashboard url", Variable: "dashboardUrl", Action: "none", Value: "/dashboard", Expectation: "url" }
  ];

  const activeTokens = pipelineData && pipelineData.length > 0 ? pipelineData : defaultTokens;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          setCsvColumns(headers);
          setCsvRowsCount(lines.length - 1);
          setDatasetSize(lines.length - 1);
        }
      };
      reader.readAsText(file);
    }
  };

  const startFineTuning = () => {
    setTraining(true);
    setTrainLogs([]);
    setCurrentProgress(0);
    setStatusMsg('Connecting to T5 Transformer pipeline...');

    const eventSource = new EventSource(`http://127.0.0.1:8000/api/train-model-stream?epochs=${epochs}&dataset_size=${datasetSize}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.progress !== undefined) {
        setCurrentProgress(data.progress);
      }
      if (data.message) {
        setStatusMsg(data.message);
      }
      if (data.epoch !== undefined) {
        setTrainLogs(prev => [...prev, data]);
      }
      if (data.progress === 100) {
        eventSource.close();
        setTraining(false);
        setStatusMsg('Model fine-tuned successfully. Saved weights to /models/t5_base_gherkin_pom.bin');
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
      setTraining(false);
      setStatusMsg('Error communicating with backend during training. Ensure backend is running.');
    };
  };

  const chartWidth = 500;
  const chartHeight = 200;
  const padding = 35;

  const getCoordinates = (epoch: number, val: number) => {
    const x = padding + ((epoch - 1) / (epochs - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (val / 1.2) * (chartHeight - padding * 2);
    return { x, y };
  };

  const getPath = (dataKey: 'train_loss' | 'val_loss') => {
    if (trainLogs.length === 0) return '';
    return trainLogs.map((d, i) => {
      const { x, y } = getCoordinates(d.epoch, d[dataKey]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>NLP Pipeline & Data Studio</h1>
        <p style={{ color: '#8f8ca4', fontSize: '0.95rem', marginTop: '4px' }}>
          Inspect the tokenization of user acceptance criteria and fine-tune models to capture semantic testing components.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Fine-Tuning Setup Panel */}
        <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={18} color="var(--secondary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>T5 Fine-Tuning Parameters</h3>
          </div>

          <div style={{
            border: '2px dashed rgba(192, 179, 245, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            background: '#0b0a10',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <Upload size={24} color="var(--secondary)" style={{ margin: '0 auto 8px' }} />
            {csvFile ? (
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>{csvFile.name} Uploaded</span>
                <div style={{ fontSize: '0.7rem', color: '#8f8ca4', marginTop: '4px' }}>
                  Found {csvRowsCount} pairs | Headers: {csvColumns.slice(0, 3).join(', ')}
                </div>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#ffffff' }}>Upload Dataset CSV (User Stories & Criteria)</span>
                <div style={{ fontSize: '0.7rem', color: '#8f8ca4', marginTop: '4px' }}>
                  Drag & drop your training spreadsheet here (supports columns: Story, Criteria)
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: '#8f8ca4' }}>Epochs</label>
              <input 
                type="number" 
                className="input-field" 
                value={epochs} 
                min={1} 
                max={15} 
                onChange={(e) => setEpochs(parseInt(e.target.value) || 5)} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: '#8f8ca4' }}>Dataset Size</label>
              <input 
                type="number" 
                className="input-field" 
                value={datasetSize} 
                disabled={csvFile !== null}
                onChange={(e) => setDatasetSize(parseInt(e.target.value) || 150)} 
              />
            </div>
          </div>

          {training && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: '#8f8ca4' }}>Training Progress...</span>
                <span>{currentProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#0b0a10', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${currentProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          <div style={{ 
            fontSize: '0.75rem', 
            color: '#8f8ca4',
            background: '#0b0a10',
            padding: '10px 14px',
            borderRadius: '12px',
            borderLeft: `3px solid ${training ? 'var(--secondary)' : 'rgba(192,179,245,0.1)'}`,
            borderTop: '1px solid rgba(192,179,245,0.05)',
            borderRight: '1px solid rgba(192,179,245,0.05)',
            borderBottom: '1px solid rgba(192,179,245,0.05)'
          }}>
            Status: {statusMsg}
          </div>

          <button 
            className="btn btn-gradient" 
            onClick={startFineTuning} 
            disabled={training || !csvFile}
            style={{ width: '100%' }}
          >
            {training ? (
              <>
                <Activity className="animate-spin" size={18} />
                <span>Fine-Tuning Active...</span>
              </>
            ) : !csvFile ? (
              <>
                <Cpu size={18} />
                <span>Upload CSV to Fine-Tune</span>
              </>
            ) : (
              <>
                <Cpu size={18} />
                <span>Fine-Tune T5 Model</span>
              </>
            )}
          </button>
        </div>

        {/* Live Training Metrics Graph */}
        <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Real-Time Loss Graph</h3>
              <p style={{ color: '#8f8ca4', fontSize: '0.8rem' }}>Plots fine-tuning error rates during training stream</p>
            </div>
            <Activity size={18} color="var(--secondary)" className={training ? "animate-pulse" : ""} />
          </div>

          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', background: '#0b0a10', borderRadius: '20px', padding: '12px', minHeight: '220px', border: '1px solid rgba(192, 179, 245, 0.04)' }}>
            {trainLogs.length > 0 ? (
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                {[0, 0.3, 0.6, 0.9, 1.2].map((v, i) => {
                  const y = chartHeight - padding - (v / 1.2) * (chartHeight - padding * 2);
                  return (
                    <g key={i}>
                      <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(192, 179, 245, 0.03)" strokeDasharray="3,3" />
                      <text x={padding - 8} y={y + 4} fill="#8f8ca4" fontSize="9" textAnchor="end">{v}</text>
                    </g>
                  );
                })}
                {trainLogs.map((d, i) => {
                  const x = padding + (i / (epochs - 1 || 1)) * (chartWidth - padding * 2);
                  return (
                    <text key={i} x={x} y={chartHeight - 8} fill="#8f8ca4" fontSize="9" textAnchor="middle">
                      Ep {d.epoch}
                    </text>
                  );
                })}
                <path d={getPath('train_loss')} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
                <path d={getPath('val_loss')} fill="none" stroke="var(--secondary)" strokeWidth="2.5" strokeDasharray="4,4" strokeLinecap="round" />

                {trainLogs.map((d, i) => {
                  const p1 = getCoordinates(d.epoch, d.train_loss);
                  const p2 = getCoordinates(d.epoch, d.val_loss);
                  return (
                    <g key={i}>
                      <circle cx={p1.x} cy={p1.y} r="5" fill="var(--primary)" stroke="#12111a" strokeWidth="1.5" />
                      <circle cx={p2.x} cy={p2.y} r="4" fill="var(--secondary)" stroke="#12111a" strokeWidth="1.5" />
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Database size={32} />
                <span style={{ fontSize: '0.8rem' }}>No active training session graph</span>
              </div>
            )}
          </div>
          
          {trainLogs.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', borderTop: '1px solid rgba(192, 179, 245, 0.05)', paddingTop: '10px' }}>
              <div>Latest Train Loss: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{trainLogs[trainLogs.length - 1].train_loss}</span></div>
              <div>Latest Val Loss: <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{trainLogs[trainLogs.length - 1].val_loss}</span></div>
              <div>Val Accuracy: <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{trainLogs[trainLogs.length - 1].val_acc}%</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Half: NLP Parsed Table */}
      <div className="saas-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#12111a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={18} color="var(--secondary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>NLP Parsing Pipeline (Preprocessing & Token Mapping)</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(192, 179, 245, 0.08)', color: 'var(--secondary)', background: '#0b0a10' }}>
                <th style={{ padding: '14px 12px', borderRadius: '12px 0 0 12px' }}>Step ID</th>
                <th style={{ padding: '14px 12px' }}>Keyword</th>
                <th style={{ padding: '14px 12px' }}>Text Content</th>
                <th style={{ padding: '14px 12px' }}>Token Extraction</th>
                <th style={{ padding: '14px 12px' }}>Part-of-Speech Tags</th>
                <th style={{ padding: '14px 12px' }}>Inferred Selector</th>
                <th style={{ padding: '14px 12px', borderRadius: '0 12px 12px 0' }}>Playwright Method</th>
              </tr>
            </thead>
            <tbody>
              {activeTokens.map((step, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(192, 179, 245, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--primary)' }}>{step.StepID || `STEP_${String(idx + 1).padStart(2, '0')}`}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      background: step.Keyword === 'Given' ? 'rgba(124,58,237,0.12)' : step.Keyword === 'When' ? 'rgba(6,182,212,0.12)' : 'rgba(236,72,153,0.12)',
                      color: step.Keyword === 'Given' ? 'var(--secondary)' : step.Keyword === 'When' ? '#22d3ee' : '#f472b6',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {step.Keyword}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#ffffff' }}>{step.Text || step.step}</td>
                  <td style={{ padding: '14px 12px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#8f8ca4' }}>{step.Tokens}</td>
                  <td style={{ padding: '14px 12px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#8f8ca4', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={step.POSTags}>{step.POSTags}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 600, color: '#ffffff' }}>
                    <code>{step.InferredSelector || step.selector}</code>
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--secondary)', fontWeight: 600 }}>
                    <code>
                      {step.Action === 'goto' ? 'goto()' : step.Action === 'type' ? 'fill()' : step.Action === 'click' ? 'click()' : step.Expectation === 'url' ? 'toHaveURL()' : step.Expectation === 'visible' ? 'toBeVisible()' : 'none'}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
