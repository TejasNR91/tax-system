import { useTax } from '../context/TaxContext.jsx'

const USER_TYPES = [
  { value: 'general', icon: '👨‍💼', label: 'General', sub: 'Below 60 years', detail: 'Basic exemption: ₹2.5L (old) / ₹3L (new)' },
  { value: 'senior', icon: '👴', label: 'Senior Citizen', sub: '60 to 79 years', detail: 'Basic exemption: ₹3L (old regime)' },
  { value: 'super_senior', icon: '🧓', label: 'Super Senior', sub: '80 years & above', detail: 'Basic exemption: ₹5L (old regime)' },
  { value: 'nri', icon: '✈️', label: 'NRI', sub: 'Non-Resident Indian', detail: 'Taxed at general slab rates, no exemption for senior' },
]

const EMP_TYPES = [
  { value: 'salaried', icon: '🏢', label: 'Salaried', sub: 'TDS deducted by employer' },
  { value: 'self_employed', icon: '💻', label: 'Self-Employed', sub: 'Freelancer / Consultant' },
  { value: 'business', icon: '🏪', label: 'Business Owner', sub: 'Proprietor / Partner / Director' },
]

export default function Step1Profile({ onNext }) {
  const { profile, setProfile } = useTax()

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }))

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="badge badge-saffron" style={{ marginBottom: 12, display: 'inline-flex' }}>Step 1 of 7</div>
        <h2>👤 Your Profile</h2>
        <p>Tell us about yourself so we can apply the right tax slabs and exemptions.</p>
      </div>

      {/* User Type */}
      <section style={{ marginBottom: 36 }}>
        <label className="form-label" style={{ marginBottom: 16, display: 'block' }}>
          Age Group / Taxpayer Category
        </label>
        <div className="grid-2" style={{ gap: 14 }}>
          {USER_TYPES.map(t => (
            <button
              key={t.value}
              className={`profile-card ${profile.userType === t.value ? 'profile-card--active' : ''}`}
              onClick={() => update('userType', t.value)}
            >
              <span className="profile-card-icon">{t.icon}</span>
              <div className="profile-card-text">
                <strong>{t.label}</strong>
                <span className="profile-sub">{t.sub}</span>
                <span className="profile-detail">{t.detail}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Employment Type */}
      <section style={{ marginBottom: 36 }}>
        <label className="form-label" style={{ marginBottom: 16, display: 'block' }}>
          Employment Type
        </label>
        <div className="grid-3" style={{ gap: 14 }}>
          {EMP_TYPES.map(t => (
            <button
              key={t.value}
              className={`profile-card ${profile.employmentType === t.value ? 'profile-card--active' : ''}`}
              onClick={() => update('employmentType', t.value)}
            >
              <span className="profile-card-icon">{t.icon}</span>
              <div className="profile-card-text">
                <strong>{t.label}</strong>
                <span className="profile-sub">{t.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Financial Year */}
      <section style={{ marginBottom: 36 }}>
        <div className="form-group">
          <label className="form-label">Financial Year</label>
          <select className="form-select" value={profile.financialYear} onChange={e => update('financialYear', e.target.value)}>
            <option value="2025-26">FY 2025-26 (AY 2026-27) — Current</option>
            <option value="2024-25">FY 2024-25 (AY 2025-26)</option>
          </select>
        </div>
      </section>

      {/* Info panel */}
      <div className="info-panel" style={{ marginBottom: 32 }}>
        <span>ℹ️</span>
        <span>
          <strong>FY 2025-26 highlights:</strong> New regime standard deduction raised to ₹75,000. 
          Section 87A rebate of ₹60,000 means zero tax for income up to ₹12 Lakh.
        </span>
      </div>

      <div className="step-nav" style={{ borderTop: 'none', paddingTop: 0 }}>
        <span />
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Next: Income Details →
        </button>
      </div>

      <style>{`
        .profile-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: var(--bg-glass);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          color: var(--text-primary);
          font-family: var(--font-body);
        }
        .profile-card:hover { border-color: var(--border-accent); background: var(--saffron-dim); }
        .profile-card--active {
          border-color: var(--saffron);
          background: var(--saffron-dim);
          box-shadow: 0 0 0 2px var(--saffron), 0 0 20px rgba(255,153,51,0.2);
        }
        .profile-card-icon { font-size: 1.8rem; flex-shrink: 0; }
        .profile-card-text { display: flex; flex-direction: column; gap: 2px; }
        .profile-card-text strong { font-size: 0.95rem; font-weight: 700; }
        .profile-sub { font-size: 0.78rem; color: var(--text-secondary); }
        .profile-detail { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
      `}</style>
    </div>
  )
}
