const express = require('express');
const cors = require('cors');
const { calculateTax, generateSuggestions, computeHRAExemption } = require('./taxEngine');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', fy: '2025-26' });
});

// POST /api/calculate — Full tax calculation
app.post('/api/calculate', (req, res) => {
  try {
    const {
      grossIncome,
      userType = 'general',
      deductions = {},
      hraData = null,
      otherIncome = {},
    } = req.body;

    if (!grossIncome || grossIncome < 0) {
      return res.status(400).json({ error: 'Invalid grossIncome' });
    }

    const result = calculateTax({
      grossIncome: Number(grossIncome),
      userType,
      deductions,
      hraData,
      otherIncome,
      regime: 'both',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suggestions — Tax saving suggestions
app.post('/api/suggestions', (req, res) => {
  try {
    const { grossIncome, deductions = {}, regime = 'old', userType = 'general' } = req.body;
    const suggestions = generateSuggestions({ grossIncome: Number(grossIncome), deductions, regime, userType });
    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hra — Standalone HRA exemption calculator
app.post('/api/hra', (req, res) => {
  try {
    const { basicSalary, hraReceived, rentPaid, isMetro } = req.body;
    const exemption = computeHRAExemption({
      basicSalary: Number(basicSalary),
      hraReceived: Number(hraReceived),
      rentPaid: Number(rentPaid),
      isMetro: Boolean(isMetro),
    });
    res.json({ success: true, data: { exemption } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/slabs — Return all tax slabs info
app.get('/api/slabs', (req, res) => {
  res.json({
    success: true,
    data: {
      fy: '2025-26',
      ay: '2026-27',
      newRegime: {
        standardDeduction: 75000,
        rebate87A: { maxRebate: 60000, incomeLimit: 1200000 },
        slabs: [
          { from: 0, to: 300000, rate: 0, label: 'Up to ₹3,00,000' },
          { from: 300000, to: 700000, rate: 5, label: '₹3,00,001 – ₹7,00,000' },
          { from: 700000, to: 1000000, rate: 10, label: '₹7,00,001 – ₹10,00,000' },
          { from: 1000000, to: 1200000, rate: 15, label: '₹10,00,001 – ₹12,00,000' },
          { from: 1200000, to: 1500000, rate: 20, label: '₹12,00,001 – ₹15,00,000' },
          { from: 1500000, to: null, rate: 30, label: 'Above ₹15,00,000' },
        ],
        surcharge: [
          { above: 5000000, rate: 10 },
          { above: 10000000, rate: 15 },
          { above: 20000000, rate: 25 },
          { above: 50000000, rate: 25 },
        ],
        cess: 4,
        keyFeatures: [
          'No need to maintain investment proofs',
          'Higher standard deduction of ₹75,000',
          'Zero tax up to ₹12L income (with rebate)',
          'Employer NPS deduction (80CCD2) still allowed',
          'Simpler compliance',
        ],
      },
      oldRegime: {
        standardDeduction: 50000,
        rebate87A: { maxRebate: 12500, incomeLimit: 500000 },
        generalSlabs: [
          { from: 0, to: 250000, rate: 0, label: 'Up to ₹2,50,000' },
          { from: 250000, to: 500000, rate: 5, label: '₹2,50,001 – ₹5,00,000' },
          { from: 500000, to: 1000000, rate: 20, label: '₹5,00,001 – ₹10,00,000' },
          { from: 1000000, to: null, rate: 30, label: 'Above ₹10,00,000' },
        ],
        seniorSlabs: [
          { from: 0, to: 300000, rate: 0, label: 'Up to ₹3,00,000' },
          { from: 300000, to: 500000, rate: 5, label: '₹3,00,001 – ₹5,00,000' },
          { from: 500000, to: 1000000, rate: 20, label: '₹5,00,001 – ₹10,00,000' },
          { from: 1000000, to: null, rate: 30, label: 'Above ₹10,00,000' },
        ],
        superSeniorSlabs: [
          { from: 0, to: 500000, rate: 0, label: 'Up to ₹5,00,000' },
          { from: 500000, to: 1000000, rate: 20, label: '₹5,00,001 – ₹10,00,000' },
          { from: 1000000, to: null, rate: 30, label: 'Above ₹10,00,000' },
        ],
        surcharge: [
          { above: 5000000, rate: 10 },
          { above: 10000000, rate: 15 },
          { above: 20000000, rate: 25 },
          { above: 50000000, rate: 37 },
        ],
        cess: 4,
        majorDeductions: [
          { section: '80C', limit: 150000, description: 'PPF, ELSS, EPF, LIC, NSC, Home Loan Principal' },
          { section: '80CCD(1B)', limit: 50000, description: 'NPS Additional Contribution' },
          { section: '80D', limit: '25,000 (self) + 50,000 (senior parents)', description: 'Health Insurance Premium' },
          { section: '24(b)', limit: 200000, description: 'Home Loan Interest (Self-Occupied)' },
          { section: 'HRA', limit: 'Minimum of 3 conditions', description: 'House Rent Allowance Exemption' },
          { section: '80E', limit: 'No limit', description: 'Education Loan Interest' },
          { section: '80G', limit: 'Up to 100%/50% of donation', description: 'Donations to Charitable Institutions' },
          { section: '80TTA', limit: 10000, description: 'Savings Account Interest (non-seniors)' },
          { section: '80TTB', limit: 50000, description: 'Interest Income for Senior Citizens' },
          { section: '80EEA', limit: 150000, description: 'Affordable Housing Loan Interest' },
          { section: '80EEB', limit: 150000, description: 'EV Loan Interest' },
          { section: '80DD', limit: '75,000 / 1,25,000 (severe)', description: 'Disabled Dependent' },
          { section: '80U', limit: '75,000 / 1,25,000 (severe)', description: 'Self Disability' },
        ],
        keyFeatures: [
          'Up to ₹4.25L+ tax savings possible with deductions',
          'HRA exemption available for rent payers',
          'Home loan interest deduction (₹2L p.a.)',
          'Extensive 80C/80D/NPS deductions',
          'Better for those with high deductions',
        ],
      },
      capitalGains: {
        stcg: { rate: 15, section: '111A', description: 'Short-Term Capital Gains on equity (held < 1 year)' },
        ltcg: { rate: 10, exemption: 100000, section: '112A', description: 'Long-Term Capital Gains on equity > ₹1L' },
        ltcgDebt: { rate: 20, description: 'LTCG on debt funds/other assets' },
        stcgOther: { rate: 'slab rate', description: 'STCG on non-equity assets' },
      },
    },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🇮🇳 Tax API running on http://localhost:${PORT}`));
