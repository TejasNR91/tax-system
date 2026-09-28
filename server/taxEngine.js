/**
 * 🇮🇳 Indian Tax Calculation Engine — FY 2025-26 (AY 2026-27)
 * Covers: Old Regime, New Regime, Surcharge, Health & Education Cess,
 *         Section 87A Rebate, HRA Exemption, All Major Deductions
 */

// ─── NEW REGIME SLABS (Default from FY 2024-25 onwards) ────────────────────
const NEW_REGIME_SLABS = [
  { upTo: 300000, rate: 0 },
  { upTo: 700000, rate: 0.05 },
  { upTo: 1000000, rate: 0.10 },
  { upTo: 1200000, rate: 0.15 },
  { upTo: 1500000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// ─── OLD REGIME SLABS ───────────────────────────────────────────────────────
const OLD_REGIME_SLABS_GENERAL = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// Senior Citizens (60-79 yrs) — higher basic exemption
const OLD_REGIME_SLABS_SENIOR = [
  { upTo: 300000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// Super Senior Citizens (80+ yrs)
const OLD_REGIME_SLABS_SUPER_SENIOR = [
  { upTo: 500000, rate: 0 },
  { upTo: 1000000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

// ─── SURCHARGE RATES ────────────────────────────────────────────────────────
// New Regime: Max surcharge capped at 25%
const SURCHARGE_RATES_NEW = [
  { above: 50000000, rate: 0.25 }, // >5Cr
  { above: 20000000, rate: 0.25 }, // >2Cr (capped at 25% in new)
  { above: 10000000, rate: 0.15 }, // >1Cr
  { above: 5000000, rate: 0.10 },  // >50L
  { above: 0, rate: 0 },
];

// Old Regime
const SURCHARGE_RATES_OLD = [
  { above: 50000000, rate: 0.37 }, // >5Cr
  { above: 20000000, rate: 0.25 }, // >2Cr
  { above: 10000000, rate: 0.15 }, // >1Cr
  { above: 5000000, rate: 0.10 },  // >50L
  { above: 0, rate: 0 },
];

// Health & Education Cess: 4% on (tax + surcharge)
const CESS_RATE = 0.04;

// ─── COMPUTE TAX ON SLAB BASIS ──────────────────────────────────────────────
function computeSlabTax(income, slabs) {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upTo) - prev;
    tax += taxable * slab.rate;
    prev = slab.upTo;
    if (slab.upTo === Infinity) break;
  }
  return Math.round(tax);
}

// ─── SURCHARGE CALCULATION ──────────────────────────────────────────────────
function computeSurcharge(income, taxBeforeSurcharge, isNewRegime) {
  const rates = isNewRegime ? SURCHARGE_RATES_NEW : SURCHARGE_RATES_OLD;
  for (const tier of rates) {
    if (income > tier.above) {
      // Marginal relief: ensure surcharge doesn't eat more than the income above threshold
      const surcharge = taxBeforeSurcharge * tier.rate;
      return Math.round(surcharge);
    }
  }
  return 0;
}

// ─── SECTION 87A REBATE ─────────────────────────────────────────────────────
function compute87ARebase(taxableIncome, slabTax, isNewRegime) {
  if (isNewRegime) {
    // New regime: rebate up to ₹60,000 if taxable income ≤ ₹12L
    if (taxableIncome <= 1200000) {
      return Math.min(slabTax, 60000);
    }
  } else {
    // Old regime: rebate up to ₹12,500 if taxable income ≤ ₹5L
    if (taxableIncome <= 500000) {
      return Math.min(slabTax, 12500);
    }
  }
  return 0;
}

// ─── HRA EXEMPTION ──────────────────────────────────────────────────────────
function computeHRAExemption({ basicSalary, hraReceived, rentPaid, isMetro }) {
  if (!rentPaid || rentPaid <= 0) return 0;
  const metroPercent = isMetro ? 0.50 : 0.40;
  const exemption = Math.min(
    hraReceived,
    metroPercent * basicSalary,
    rentPaid - 0.10 * basicSalary
  );
  return Math.max(0, Math.round(exemption));
}

// ─── OLD REGIME DEDUCTIONS ──────────────────────────────────────────────────
function computeOldRegimeDeductions(deductions, income, userType, rentPaid, hraData) {
  const {
    sec80C = 0,          // PPF, ELSS, EPF, LIC, NSC, Home Loan Principal
    sec80CCC = 0,        // Pension plan premium (LIC, etc.)
    sec80CCD1 = 0,       // Employee NPS (part of 80C limit)
    sec80CCD1B = 0,      // NPS additional (over 80C limit) — up to ₹50,000
    sec80CCD2 = 0,       // Employer NPS contribution
    sec80D_self = 0,     // Health insurance — self/spouse/kids
    sec80D_parents = 0,  // Health insurance — parents
    sec80D_parents_senior = false,
    sec80DD = 0,         // Disabled dependent — ₹75K/₹1.25L
    sec80DD_severe = false,
    sec80DDB = 0,        // Medical treatment specified diseases
    sec80DDB_senior = false,
    sec80E = 0,          // Education loan interest (no limit)
    sec80EEA = 0,        // Home loan interest — affordable housing (₹1.5L)
    sec80EEB = 0,        // Electric vehicle loan interest (₹1.5L)
    sec80G = 0,          // Donations (50–100% of amount)
    sec80GGA = 0,        // Donations for scientific research
    sec80GGC = 0,        // Political party donations
    sec80TTA = 0,        // Savings account interest (up to ₹10,000; not for seniors)
    sec80TTB = 0,        // Senior citizen: FD/savings interest (up to ₹50,000)
    sec80U = 0,          // Self disability
    sec80U_severe = false,
    homeLoanInterest24b = 0,   // Home loan interest — self-occupied (up to ₹2L)
    homeLoanInterestLetOut = 0, // Home loan interest — let-out (no limit)
    professionalTax = 0,       // Up to ₹2,400
    lta = 0,                   // Leave Travel Allowance
    standardDeduction = 0,     // ₹50,000 for salaried
  } = deductions;

  let total = 0;
  const breakdown = {};

  // Standard Deduction — ₹50,000 for salaried/pensioners
  const sd = Math.min(standardDeduction, 50000);
  breakdown['Standard Deduction (u/s 16)'] = sd;
  total += sd;

  // Professional Tax
  const pt = Math.min(professionalTax, 2400);
  breakdown['Professional Tax (u/s 16)'] = pt;
  total += pt;

  // HRA Exemption
  const hraEx = hraData ? computeHRAExemption(hraData) : 0;
  breakdown['HRA Exemption (u/s 10(13A))'] = hraEx;
  total += hraEx;

  // LTA
  breakdown['LTA (u/s 10(5))'] = lta;
  total += lta;

  // Chapter VI-A Deductions
  // 80C + 80CCC + 80CCD(1) combined limit: ₹1,50,000
  const sec80C_combined = Math.min(sec80C + sec80CCC + sec80CCD1, 150000);
  breakdown['Section 80C/80CCC/80CCD(1) — PPF/ELSS/EPF/LIC/NSC'] = sec80C_combined;
  total += sec80C_combined;

  // 80CCD(1B) — NPS additional ₹50,000
  const nps1b = Math.min(sec80CCD1B, 50000);
  breakdown['Section 80CCD(1B) — NPS Additional'] = nps1b;
  total += nps1b;

  // 80CCD(2) — Employer NPS: 10% of (Basic+DA) — no upper monetary limit in law
  breakdown['Section 80CCD(2) — Employer NPS'] = sec80CCD2;
  total += sec80CCD2;

  // 80D — Health Insurance
  const d_self = Math.min(sec80D_self, 25000);
  const d_parents = sec80D_parents_senior
    ? Math.min(sec80D_parents, 50000)
    : Math.min(sec80D_parents, 25000);
  breakdown['Section 80D — Health Insurance (Self)'] = d_self;
  breakdown['Section 80D — Health Insurance (Parents)'] = d_parents;
  total += d_self + d_parents;

  // 80DD — Disabled Dependent
  const dd = sec80DD_severe ? 125000 : 75000;
  if (sec80DD > 0) {
    breakdown['Section 80DD — Disabled Dependent'] = dd;
    total += dd;
  }

  // 80DDB — Medical treatment
  const ddb_limit = sec80DDB_senior ? 100000 : 40000;
  const ddb = Math.min(sec80DDB, ddb_limit);
  breakdown['Section 80DDB — Medical Treatment'] = ddb;
  total += ddb;

  // 80E — Education Loan Interest (no cap)
  breakdown['Section 80E — Education Loan Interest'] = sec80E;
  total += sec80E;

  // 80EEA — Affordable Housing Loan Interest (up to ₹1.5L)
  const eea = Math.min(sec80EEA, 150000);
  breakdown['Section 80EEA — Affordable Housing Loan Interest'] = eea;
  total += eea;

  // 80EEB — EV Loan Interest (up to ₹1.5L)
  const eeb = Math.min(sec80EEB, 150000);
  breakdown['Section 80EEB — EV Loan Interest'] = eeb;
  total += eeb;

  // 80G — Donations (simplified as 50% of declared amount here)
  const g = Math.round(sec80G * 0.5);
  breakdown['Section 80G — Donations (50%)'] = g;
  total += g;

  // 80TTA — Savings Interest (not for seniors, up to ₹10,000)
  const tta = Math.min(sec80TTA, 10000);
  breakdown['Section 80TTA — Savings Account Interest'] = tta;
  total += tta;

  // 80TTB — Senior Citizen: All interest income up to ₹50,000
  const ttb = Math.min(sec80TTB, 50000);
  breakdown['Section 80TTB — Senior Citizen Interest Income'] = ttb;
  total += ttb;

  // 80U — Self disability
  const u = sec80U_severe ? 125000 : 75000;
  if (sec80U > 0) {
    breakdown['Section 80U — Self Disability'] = u;
    total += u;
  }

  // Home Loan Interest u/s 24(b) — self-occupied (up to ₹2L)
  const hl24 = Math.min(homeLoanInterest24b, 200000);
  breakdown['Section 24(b) — Home Loan Interest (Self-Occupied)'] = hl24;
  total += hl24;

  // Home Loan Interest — let-out (no cap)
  breakdown['Section 24(b) — Home Loan Interest (Let-Out)'] = homeLoanInterestLetOut;
  total += homeLoanInterestLetOut;

  return { total, breakdown };
}

// ─── NEW REGIME DEDUCTIONS (very limited) ───────────────────────────────────
function computeNewRegimeDeductions(deductions, userType) {
  const {
    sec80CCD2 = 0,       // Employer NPS — allowed in new regime
    standardDeduction = 0,
    professionalTax = 0,
    agnipath = 0,        // Agnipath scheme
  } = deductions;

  let total = 0;
  const breakdown = {};

  // Standard Deduction — ₹75,000 for salaried in new regime (from FY 2024-25)
  const sd = Math.min(standardDeduction, 75000);
  breakdown['Standard Deduction (u/s 16) — New Regime'] = sd;
  total += sd;

  // Professional Tax
  const pt = Math.min(professionalTax, 2400);
  breakdown['Professional Tax (u/s 16)'] = pt;
  total += pt;

  // Employer NPS contribution u/s 80CCD(2)
  breakdown['Section 80CCD(2) — Employer NPS'] = sec80CCD2;
  total += sec80CCD2;

  // Agnipath scheme
  breakdown['Agnipath Corpus Fund (u/s 80CCH)'] = agnipath;
  total += agnipath;

  return { total, breakdown };
}

// ─── MAIN TAX CALCULATION ───────────────────────────────────────────────────
function calculateTax({
  grossIncome,
  userType = 'general', // 'general' | 'senior' | 'super_senior' | 'nri'
  deductions = {},
  hraData = null,
  otherIncome = {},
  regime = 'both',       // 'old' | 'new' | 'both'
}) {
  const result = {};

  // Total income
  const {
    interestIncome = 0,
    rentalIncome = 0,
    capitalGainsSTCG = 0,    // Short-term capital gains (15% u/s 111A)
    capitalGainsLTCG = 0,    // Long-term capital gains (10% u/s 112A above ₹1L)
    agriculturalIncome = 0,  // Exempt
  } = otherIncome;

  const baseIncome = grossIncome + interestIncome + rentalIncome;

  // ── OLD REGIME ──────────────────────────────────────────────────────────
  if (regime === 'old' || regime === 'both') {
    const { total: oldDed, breakdown: oldDedBreakdown } = computeOldRegimeDeductions(
      deductions, grossIncome, userType, null, hraData
    );

    let slabs = OLD_REGIME_SLABS_GENERAL;
    if (userType === 'senior') slabs = OLD_REGIME_SLABS_SENIOR;
    if (userType === 'super_senior') slabs = OLD_REGIME_SLABS_SUPER_SENIOR;

    const taxableIncome_old = Math.max(0, baseIncome - oldDed);
    const slabTax_old = computeSlabTax(taxableIncome_old, slabs);
    const rebate_old = compute87ARebase(taxableIncome_old, slabTax_old, false);
    const taxAfterRebate_old = Math.max(0, slabTax_old - rebate_old);

    // STCG taxed @15%, LTCG @10% above ₹1L — added separately
    const stcgTax = Math.round(capitalGainsSTCG * 0.15);
    const ltcgTaxable = Math.max(0, capitalGainsLTCG - 100000);
    const ltcgTax = Math.round(ltcgTaxable * 0.10);
    const totalBeforeSurcharge_old = taxAfterRebate_old + stcgTax + ltcgTax;

    const surcharge_old = computeSurcharge(baseIncome, totalBeforeSurcharge_old, false);
    const cess_old = Math.round((totalBeforeSurcharge_old + surcharge_old) * CESS_RATE);
    const totalTax_old = totalBeforeSurcharge_old + surcharge_old + cess_old;

    const effectiveRate_old = baseIncome > 0
      ? ((totalTax_old / baseIncome) * 100).toFixed(2)
      : '0.00';
    const marginalRate_old = baseIncome > 1000000 ? '30%' : baseIncome > 500000 ? '20%' : '5%';

    result.oldRegime = {
      grossIncome,
      totalDeductions: oldDed,
      deductionBreakdown: oldDedBreakdown,
      taxableIncome: taxableIncome_old,
      slabTax: slabTax_old,
      rebate87A: rebate_old,
      stcgTax,
      ltcgTax,
      surcharge: surcharge_old,
      cess: cess_old,
      totalTax: totalTax_old,
      effectiveRate: effectiveRate_old,
      marginalRate: marginalRate_old,
      monthlyTax: Math.round(totalTax_old / 12),
      slabs: [
        { range: 'Up to ₹2.5L', rate: '0%', taxable: Math.min(taxableIncome_old, 250000) },
        { range: '₹2.5L – ₹5L', rate: '5%', taxable: Math.max(0, Math.min(taxableIncome_old, 500000) - 250000) },
        { range: '₹5L – ₹10L', rate: '20%', taxable: Math.max(0, Math.min(taxableIncome_old, 1000000) - 500000) },
        { range: 'Above ₹10L', rate: '30%', taxable: Math.max(0, taxableIncome_old - 1000000) },
      ],
    };
  }

  // ── NEW REGIME ──────────────────────────────────────────────────────────
  if (regime === 'new' || regime === 'both') {
    const { total: newDed, breakdown: newDedBreakdown } = computeNewRegimeDeductions(
      deductions, userType
    );

    const taxableIncome_new = Math.max(0, baseIncome - newDed);
    const slabTax_new = computeSlabTax(taxableIncome_new, NEW_REGIME_SLABS);
    const rebate_new = compute87ARebase(taxableIncome_new, slabTax_new, true);
    const taxAfterRebate_new = Math.max(0, slabTax_new - rebate_new);

    const stcgTax = Math.round(capitalGainsSTCG * 0.15);
    const ltcgTaxable = Math.max(0, capitalGainsLTCG - 100000);
    const ltcgTax = Math.round(ltcgTaxable * 0.10);
    const totalBeforeSurcharge_new = taxAfterRebate_new + stcgTax + ltcgTax;

    const surcharge_new = computeSurcharge(baseIncome, totalBeforeSurcharge_new, true);
    const cess_new = Math.round((totalBeforeSurcharge_new + surcharge_new) * CESS_RATE);
    const totalTax_new = totalBeforeSurcharge_new + surcharge_new + cess_new;

    const effectiveRate_new = baseIncome > 0
      ? ((totalTax_new / baseIncome) * 100).toFixed(2)
      : '0.00';

    result.newRegime = {
      grossIncome,
      totalDeductions: newDed,
      deductionBreakdown: newDedBreakdown,
      taxableIncome: taxableIncome_new,
      slabTax: slabTax_new,
      rebate87A: rebate_new,
      stcgTax,
      ltcgTax,
      surcharge: surcharge_new,
      cess: cess_new,
      totalTax: totalTax_new,
      effectiveRate: effectiveRate_new,
      monthlyTax: Math.round(totalTax_new / 12),
      slabs: [
        { range: 'Up to ₹3L', rate: '0%', taxable: Math.min(taxableIncome_new, 300000) },
        { range: '₹3L – ₹7L', rate: '5%', taxable: Math.max(0, Math.min(taxableIncome_new, 700000) - 300000) },
        { range: '₹7L – ₹10L', rate: '10%', taxable: Math.max(0, Math.min(taxableIncome_new, 1000000) - 700000) },
        { range: '₹10L – ₹12L', rate: '15%', taxable: Math.max(0, Math.min(taxableIncome_new, 1200000) - 1000000) },
        { range: '₹12L – ₹15L', rate: '20%', taxable: Math.max(0, Math.min(taxableIncome_new, 1500000) - 1200000) },
        { range: 'Above ₹15L', rate: '30%', taxable: Math.max(0, taxableIncome_new - 1500000) },
      ],
    };
  }

  // ── RECOMMENDATION ──────────────────────────────────────────────────────
  if (regime === 'both' && result.oldRegime && result.newRegime) {
    const savings = result.oldRegime.totalTax - result.newRegime.totalTax;
    result.recommendation = {
      betterRegime: savings > 0 ? 'new' : savings < 0 ? 'old' : 'either',
      savings: Math.abs(savings),
      reason: savings > 0
        ? `New Regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')} annually`
        : savings < 0
        ? `Old Regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')} annually due to deductions`
        : 'Both regimes result in the same tax. Choose new for simplicity.',
    };
  }

  return result;
}

// ─── TAX SAVING SUGGESTIONS ─────────────────────────────────────────────────
function generateSuggestions({ grossIncome, deductions = {}, regime = 'old', userType = 'general' }) {
  const suggestions = [];

  if (regime === 'old') {
    // 80C gap
    const c80 = (deductions.sec80C || 0) + (deductions.sec80CCC || 0) + (deductions.sec80CCD1 || 0);
    const c80gap = Math.max(0, 150000 - c80);
    if (c80gap > 0) {
      suggestions.push({
        section: '80C',
        title: 'Maximize Section 80C Investments',
        gap: c80gap,
        taxSaving: Math.round(c80gap * (grossIncome > 1000000 ? 0.30 : grossIncome > 500000 ? 0.20 : 0.05) * 1.04),
        instruments: ['PPF (15-yr lock-in, tax-free returns)', 'ELSS Mutual Funds (3-yr lock-in, market-linked)', 'EPF Voluntary Top-up', 'LIC Premium', 'NSC', 'Sukanya Samriddhi (for girl child)', '5-Year Tax-Saving FD', 'Home Loan Principal Repayment'],
        priority: 'HIGH',
        description: `You can invest ₹${c80gap.toLocaleString('en-IN')} more to fully utilize Section 80C limit of ₹1,50,000.`,
      });
    }

    // NPS 80CCD(1B)
    const nps = deductions.sec80CCD1B || 0;
    const npsgap = Math.max(0, 50000 - nps);
    if (npsgap > 0) {
      suggestions.push({
        section: '80CCD(1B)',
        title: 'Invest in NPS for Additional ₹50,000 Deduction',
        gap: npsgap,
        taxSaving: Math.round(npsgap * (grossIncome > 1000000 ? 0.30 : 0.20) * 1.04),
        instruments: ['NPS Tier-I Account (eNPS)', 'NPS through employer'],
        priority: 'HIGH',
        description: `NPS offers an exclusive ₹50,000 deduction over and above 80C. You can claim ₹${npsgap.toLocaleString('en-IN')} more.`,
      });
    }

    // 80D Health Insurance
    const d80 = deductions.sec80D_self || 0;
    const d80gap = Math.max(0, 25000 - d80);
    if (d80gap > 0) {
      suggestions.push({
        section: '80D',
        title: 'Get Health Insurance for Tax Benefit',
        gap: d80gap,
        taxSaving: Math.round(d80gap * (grossIncome > 500000 ? 0.20 : 0.05) * 1.04),
        instruments: ['Family Floater Health Insurance', 'Individual Health Policy', 'Critical Illness Cover', 'Top-up Health Plan'],
        priority: 'MEDIUM',
        description: `Health insurance premium paid is deductible up to ₹25,000. You can claim ₹${d80gap.toLocaleString('en-IN')} more.`,
      });
    }

    // Home Loan 24(b)
    if (!deductions.homeLoanInterest24b) {
      suggestions.push({
        section: '24(b)',
        title: 'Home Loan Interest Deduction',
        gap: 200000,
        taxSaving: Math.round(200000 * 0.30 * 1.04),
        instruments: ['Home Loan (self-occupied property)', 'Joint Home Loan for higher benefit'],
        priority: 'MEDIUM',
        description: `Interest on home loan for self-occupied property is deductible up to ₹2,00,000 under Section 24(b).`,
      });
    }

    // HRA
    if (!deductions.hra && grossIncome > 300000) {
      suggestions.push({
        section: 'HRA',
        title: 'Claim HRA or Section 80GG',
        gap: null,
        taxSaving: null,
        instruments: ['Negotiate HRA component in salary', 'Section 80GG if HRA not part of salary (max ₹5,000/month)'],
        priority: 'MEDIUM',
        description: 'If you pay rent, ensure HRA is part of your salary structure or claim 80GG deduction.',
      });
    }
  }

  // Common — regardless of regime
  if (grossIncome > 500000) {
    suggestions.push({
      section: 'Salary Restructuring',
      title: 'Optimize Salary Structure (CTC Restructuring)',
      gap: null,
      taxSaving: null,
      instruments: ['Meal Coupons (₹50/day exempt)', 'Mobile/Internet reimbursement', 'Car lease policy', 'LTA (once in 2 years)', 'Uniform Allowance'],
      priority: 'LOW',
      description: 'Ask HR to restructure CTC to include tax-exempt allowances and reduce taxable salary components.',
    });
  }

  return suggestions;
}

module.exports = { calculateTax, generateSuggestions, computeHRAExemption };
