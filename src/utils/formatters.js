// Format number as Indian currency (₹)
export function formatINR(amount, options = {}) {
  const { compact = false, showSymbol = true } = options
  const num = Number(amount) || 0

  if (compact) {
    if (num >= 10000000) return `${showSymbol ? '₹' : ''}${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000)   return `${showSymbol ? '₹' : ''}${(num / 100000).toFixed(2)} L`
    if (num >= 1000)     return `${showSymbol ? '₹' : ''}${(num / 1000).toFixed(1)} K`
  }

  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Parse comma-formatted numbers
export function parseINR(str) {
  return Number(String(str).replace(/,/g, '')) || 0
}

// Format as lakh/crore shorthand
export function toShorthand(num) {
  num = Number(num) || 0
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)} L`
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)} K`
  return `₹${num.toLocaleString('en-IN')}`
}

// Compute 80C bucket total
export function compute80CTotal(deductions) {
  const fields = ['ppf', 'elss', 'epf', 'lic', 'nsc', 'sukanya', 'taxSavingFD', 'homeLoanPrincipal']
  return fields.reduce((sum, f) => sum + (parseINR(deductions[f]) || 0), 0)
}

// Get tax rate for income level (new regime)
export function getMarginalRate(income) {
  if (income <= 300000) return 0
  if (income <= 700000) return 5
  if (income <= 1000000) return 10
  if (income <= 1200000) return 15
  if (income <= 1500000) return 20
  return 30
}

// Clamp value between min and max
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

// Color by value (green = good = low tax)
export function getTaxColor(amount) {
  if (amount === 0) return 'var(--green)'
  if (amount < 50000) return 'var(--saffron)'
  if (amount < 200000) return 'var(--gold)'
  return 'var(--red)'
}
