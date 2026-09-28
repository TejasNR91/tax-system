import { createContext, useContext, useState } from 'react'

const TaxContext = createContext(null)

export function TaxProvider({ children }) {
  const [profile, setProfile] = useState({
    userType: 'general',    // general | senior | super_senior | nri
    ageGroup: 'below60',
    employmentType: 'salaried', // salaried | self_employed | business
    financialYear: '2025-26',
  })

  const [income, setIncome] = useState({
    grossSalary: '',
    basicSalary: '',
    hraReceived: '',
    rentPaid: '',
    isMetro: true,
    interestIncome: '',
    rentalIncome: '',
    capitalGainsSTCG: '',
    capitalGainsLTCG: '',
    businessIncome: '',
  })

  const [deductions, setDeductions] = useState({
    // 80C bucket
    sec80C: '',
    ppf: '',
    elss: '',
    epf: '',
    lic: '',
    nsc: '',
    sukanya: '',
    taxSavingFD: '',
    homeLoanPrincipal: '',

    // NPS
    sec80CCD1B: '',  // Employee NPS
    sec80CCD2: '',   // Employer NPS

    // 80D Health
    sec80D_self: '',
    sec80D_parents: '',
    sec80D_parents_senior: false,

    // Disability
    sec80DD: '',
    sec80DD_severe: false,
    sec80U: '',
    sec80U_severe: false,

    // Medical
    sec80DDB: '',
    sec80DDB_senior: false,

    // Loans & Housing
    homeLoanInterest24b: '',
    homeLoanInterestLetOut: '',
    sec80EEA: '',
    sec80EEB: '',

    // Education
    sec80E: '',

    // Donations
    sec80G: '',

    // Interest income
    sec80TTA: '',
    sec80TTB: '',

    // Salary components
    standardDeduction: income.grossSalary ? Math.min(Number(income.grossSalary) * 0.1, 75000) : '',
    professionalTax: '2400',
    lta: '',
  })

  const [results, setResults] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  return (
    <TaxContext.Provider value={{
      profile, setProfile,
      income, setIncome,
      deductions, setDeductions,
      results, setResults,
      suggestions, setSuggestions,
      isLoading, setIsLoading,
    }}>
      {children}
    </TaxContext.Provider>
  )
}

export function useTax() {
  const ctx = useContext(TaxContext)
  if (!ctx) throw new Error('useTax must be used within TaxProvider')
  return ctx
}
