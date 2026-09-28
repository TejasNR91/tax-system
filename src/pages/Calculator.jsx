import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useTax } from '../context/TaxContext.jsx'
import Step1Profile from '../steps/Step1Profile.jsx'
import Step2Income from '../steps/Step2Income.jsx'
import Step3Deductions from '../steps/Step3Deductions.jsx'
import Step4Comparison from '../steps/Step4Comparison.jsx'
import Step5Suggestions from '../steps/Step5Suggestions.jsx'
import Step6Optimizer from '../steps/Step6Optimizer.jsx'
import Step7Summary from '../steps/Step7Summary.jsx'
import './Calculator.css'

const STEPS = [
  { path: '', label: 'Profile', icon: '👤', short: '1' },
  { path: 'income', label: 'Income', icon: '💰', short: '2' },
  { path: 'deductions', label: 'Deductions', icon: '🧾', short: '3' },
  { path: 'compare', label: 'Compare', icon: '⚖️', short: '4' },
  { path: 'suggestions', label: 'Suggestions', icon: '💡', short: '5' },
  { path: 'optimizer', label: 'Optimizer', icon: '🔧', short: '6' },
  { path: 'summary', label: 'Summary', icon: '📄', short: '7' },
]

function getStepIndex(pathname) {
  const segment = pathname.split('/calculate/')[1] || ''
  return STEPS.findIndex(s => s.path === segment)
}

export default function Calculator() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentIdx = getStepIndex(location.pathname)

  const goToStep = (idx) => {
    const path = STEPS[idx].path
    navigate(path ? `/calculate/${path}` : '/calculate')
  }

  return (
    <div className="calc-wrapper">
      {/* Progress Nav */}
      <nav className="progress-nav">
        <div className="progress-steps">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`progress-step ${i === currentIdx ? 'active' : ''} ${i < currentIdx ? 'completed' : ''}`}
              onClick={() => i <= currentIdx && goToStep(i)}
              title={step.label}
            >
              <div className="step-circle">
                {i < currentIdx ? '✓' : step.icon}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Back to home */}
      <div className="calc-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
          ← Home
        </button>
        <div className="nav-logo">
          <span>🇮🇳</span>
          <span className="nav-logo-text">Tax<span>Saathi</span></span>
        </div>
        <span className="fy-badge">FY 2025-26</span>
      </div>

      {/* Step Routes */}
      <Routes>
        <Route index element={<Step1Profile onNext={() => goToStep(1)} />} />
        <Route path="income" element={<Step2Income onNext={() => goToStep(2)} onBack={() => goToStep(0)} />} />
        <Route path="deductions" element={<Step3Deductions onNext={() => goToStep(3)} onBack={() => goToStep(1)} />} />
        <Route path="compare" element={<Step4Comparison onNext={() => goToStep(4)} onBack={() => goToStep(2)} />} />
        <Route path="suggestions" element={<Step5Suggestions onNext={() => goToStep(5)} onBack={() => goToStep(3)} />} />
        <Route path="optimizer" element={<Step6Optimizer onNext={() => goToStep(6)} onBack={() => goToStep(4)} />} />
        <Route path="summary" element={<Step7Summary onBack={() => goToStep(5)} />} />
      </Routes>
    </div>
  )
}
