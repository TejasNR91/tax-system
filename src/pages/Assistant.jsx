import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Assistant({ selectedFY }) {
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: `Namaste! 🙏 I am **TaxSaathi AI**, your Indian Tax Reasoning Assistant for **FY ${selectedFY}**.\n\nAsk me any complex tax scenario in natural language, or tap the 🎤 microphone to speak:\n- *"I earn ₹15 lakh salary with ₹1.5L 80C and ₹50k NPS. Which regime is better?"*\n- *"I sold equity shares for ₹8 lakh that I bought for ₹3 lakh in Aug 2024."*\n- *"What is the limit for Section 80D health insurance for senior citizen parents?"*`,
      auditTrail: [],
      citations: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const chatEndRef = useRef(null);

  const samplePrompts = [
    "I earn ₹15 lakh salary. Which tax regime should I evaluate?",
    "I sold shares for ₹8 lakh that I bought for ₹3 lakh.",
    "What are the health insurance deduction limits under Section 80D?",
    "Calculate tax for ₹60 lakh salary in FY 2024-25."
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Web Speech API - Voice Recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Text-to-Speech Audio Readout
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (queryText = inputQuery) => {
    if (!queryText.trim()) return;

    const userMsg = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    // Live thinking steps sequence
    setThinkingStep('🔍 Searching Income Tax Act Knowledge Base & CBDT Circulars...');
    setTimeout(() => setThinkingStep('🧮 Running Deterministic Tax Calculator Engine...'), 500);
    setTimeout(() => setThinkingStep('📜 Synthesizing Official Citations & Audit Trail...'), 1000);

    try {
      // Prepare multi-turn history payload
      const historyPayload = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await axios.post('/api/chat', {
        message: queryText,
        financial_year: selectedFY,
        chat_history: historyPayload
      });

      const agentMsg = {
        sender: 'agent',
        text: res.data.response,
        auditTrail: res.data.audit_trail || [],
        citations: res.data.context_docs || [],
        toolResults: res.data.tool_results || []
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'agent', text: '⚠️ Connection error. Please ensure the FastAPI backend is running.' }
      ]);
    } finally {
      setLoading(false);
      setThinkingStep('');
    }
  };

  const exportReport = () => {
    const reportText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n---\n\n');
    const blob = new Blob([`TAXSAATHI AI REASONING REPORT\nFinancial Year: ${selectedFY}\nDate: ${new Date().toLocaleString()}\n\n` + reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaxSaathi_Report_${selectedFY}.txt`;
    a.click();
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800' }}>
            🤖 AI Tax Reasoning <span style={{ color: 'var(--saffron)' }}>Assistant</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Multi-turn intelligent tax reasoning chatbot with voice input, audio speech, & RAG citations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportReport} className="btn btn-ghost btn-sm" title="Export report">
            📥 Export Report
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
          >
            💬 Chat View
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
          >
            🔍 System Audit Log
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '680px' }}>
          
          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '12px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.sender === 'user' ? 'var(--saffron-dim)' : 'var(--bg-glass)',
                  border: msg.sender === 'user' ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '18px 22px',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: msg.sender === 'user' ? 'var(--saffron)' : 'var(--gold)' }}>
                    {msg.sender === 'user' ? '👤 YOU' : '🤖 TAXSAATHI REASONING AGENT'}
                  </div>
                  {msg.sender === 'agent' && (
                    <button
                      onClick={() => speakText(msg.text)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Listen to audio explanation"
                    >
                      🔊 Listen
                    </button>
                  )}
                </div>
                
                <div style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>

                {/* Render Interactive Tool Calculation Cards */}
                {msg.toolResults && msg.toolResults.map((tr, tIdx) => (
                  <div key={tIdx} style={{ marginTop: '14px', padding: '14px', background: 'var(--bg-input)', borderRadius: '14px', border: '1px solid var(--border-accent)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--saffron)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      🧮 Executed Deterministic Tool: {tr.tool_name}
                    </div>
                    {tr.output.old_regime && tr.output.new_regime && (
                      <div className="grid-2" style={{ gap: '10px' }}>
                        <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: '8px', fontSize: '0.8rem' }}>
                          Old Tax: <strong style={{ color: 'var(--red)' }}>₹{tr.output.old_regime.total_tax_liability.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: '8px', fontSize: '0.8rem' }}>
                          New Tax: <strong style={{ color: 'var(--green)' }}>₹{tr.output.new_regime.total_tax_liability.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Render Citations Badge Drawer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      📜 Referenced Official Legal Sources:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {msg.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="badge badge-gold"
                          style={{ textDecoration: 'none' }}
                        >
                          📌 {c.section}: {c.rule_name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-glass)', padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-accent)' }}>
                <div className="loader" style={{ width: '20px', height: '20px' }}></div>
                <span style={{ fontSize: '0.88rem', color: 'var(--saffron)', fontWeight: '600' }}>
                  {thinkingStep || 'AI Agent is reasoning...'}
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sample Prompts */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 0 8px 0' }}>
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                💡 {prompt}
              </button>
            ))}
          </div>

          {/* Input Box + Voice Microphone */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={startListening}
              className={`btn ${isListening ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}
              title="Click to speak (Voice Recognition)"
            >
              🎤
            </button>

            <input
              type="text"
              className="form-input"
              placeholder={isListening ? 'Listening to your voice...' : "Ask any tax question (e.g. 'I earn ₹15 lakh salary...')..."}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />

            <button onClick={() => handleSend()} className="btn btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
              Send 🚀
            </button>
          </div>

        </div>
      ) : (
        /* Audit View */
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>
            🔍 Reasoning & Tool Execution Audit Logs
          </h3>
          {messages.filter(m => m.auditTrail && m.auditTrail.length > 0).map((m, idx) => (
            <div key={idx} style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: '700', color: 'var(--saffron)', marginBottom: '8px' }}>
                Query: "{m.text.slice(0, 60)}..."
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {m.auditTrail.map((step, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
