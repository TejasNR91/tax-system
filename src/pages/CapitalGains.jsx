import React, { useState } from 'react';
import axios from 'axios';
import HelpTooltip from '../components/HelpTooltip';

export default function CapitalGains({ selectedFY }) {
  const [assetType, setAssetType] = useState('equity');
  const [salePrice, setSalePrice] = useState(800000);
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [purchaseDate, setPurchaseDate] = useState('2022-01-15');
  const [saleDate, setSaleDate] = useState('2024-08-10');
  const [result, setResult] = useState(null);

  const handleCalculate = async () => {
    try {
      const res = await axios.post('/api/tax/capital-gains', {
        financial_year: selectedFY,
        asset_type: assetType,
        sale_price: Number(salePrice),
        purchase_price: Number(purchasePrice),
        purchase_date: purchaseDate,
        sale_date: saleDate
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
          📈 Capital Gains <span style={{ color: 'var(--saffron)' }}>Calculator</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Computes LTCG / STCG tax under Sec 112A, 111A, 54 & 54F for FY {selectedFY}.
        </p>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ padding: '28px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
              Asset Category
              <HelpTooltip
                title="Asset Classification"
                section="Section 112A / 111A"
                text="Equity holding period > 12 months = LTCG (12.5% tax above ₹1.25L exemption). Real Estate / Gold > 24 months = LTCG."
              />
            </label>
            <select className="form-select" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
              <option value="equity">Equity Shares / Equity Mutual Funds (Sec 112A / 111A)</option>
              <option value="real_estate">Real Estate Property (Sec 54 Exemption)</option>
              <option value="gold">Gold / Physical Assets</option>
              <option value="debt">Debt Mutual Funds / Bonds</option>
            </select>
          </div>

          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Sale Price (₹)
                <HelpTooltip
                  title="Full Value of Consideration"
                  text="Total sale value received on transfer of the asset minus brokerages/transfer expenses."
                />
              </label>
              <input type="number" className="form-input" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Purchase Price (₹)
                <HelpTooltip
                  title="Cost of Acquisition"
                  text="Original purchase price paid to buy the asset."
                />
              </label>
              <input type="number" className="form-input" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Purchase Date
                <HelpTooltip
                  title="Purchase Date"
                  text="Date on which the asset was acquired, used to calculate exact holding period in months."
                />
              </label>
              <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Sale Date
                <HelpTooltip
                  title="Sale Date"
                  text="Date on which the asset was sold, determining applicable financial year tax rates."
                />
              </label>
              <input type="date" className="form-input" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </div>
          </div>

          <button onClick={handleCalculate} className="btn btn-primary" style={{ width: '100%' }}>
            Calculate Capital Gains 📈
          </button>
        </div>

        {/* Results */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--gold)' }}>
            Capital Gain Computation Breakdown
          </h3>

          {!result ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Enter asset purchase and sale details to view tax computations.
            </div>
          ) : (
            <div>
              <div className={`badge ${result.is_ltcg ? 'badge-green' : 'badge-saffron'}`} style={{ marginBottom: '16px' }}>
                {result.is_ltcg ? 'LONG TERM CAPITAL GAIN (LTCG)' : 'SHORT TERM CAPITAL GAIN (STCG)'}
              </div>

              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--gold)', marginBottom: '12px' }}>
                ₹{result.tax_amount.toLocaleString('en-IN')} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Tax Payable</span>
              </div>

              <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '12px', fontSize: '0.88rem', lineHeight: '1.8' }}>
                <div>Gross Profit: <strong>₹{result.gross_gain.toLocaleString('en-IN')}</strong></div>
                <div>Exemption Allowed: <strong>₹{result.exemption_applied.toLocaleString('en-IN')}</strong></div>
                <div>Net Taxable Gain: <strong>₹{result.taxable_gain.toLocaleString('en-IN')}</strong></div>
                <div>Tax Rate: <strong>{(result.applicable_tax_rate * 100).toFixed(1)}%</strong></div>
                <div>Holding Period: <strong>{result.holding_months} Months</strong></div>
                <div style={{ marginTop: '8px', color: 'var(--saffron)' }}>Citation: {result.citation}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
