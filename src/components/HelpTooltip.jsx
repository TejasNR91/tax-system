import React, { useState } from 'react';

export default function HelpTooltip({ title, text, section }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--saffron-dim)',
          border: '1px solid var(--border-accent)',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: '800',
          color: 'var(--saffron)',
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1
        }}
        title="Click to view tax explanation"
      >
        ?
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '270px',
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--saffron)',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
              zIndex: 999,
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              lineHeight: '1.5'
            }}
          >
            {section && (
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--saffron)', textTransform: 'uppercase', marginBottom: '4px' }}>
                📌 {section}
              </div>
            )}
            <div style={{ fontWeight: '700', marginBottom: '4px', color: 'var(--gold)' }}>
              {title}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {text}
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'var(--saffron-dim)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '12px',
                  color: 'var(--saffron)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '2px 8px'
                }}
              >
                Close ✕
              </button>
            </div>
          </div>
        </>
      )}
    </span>
  );
}
