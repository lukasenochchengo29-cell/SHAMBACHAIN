import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, scoreToTier } from '../context/AppContext.jsx'
import { useScore } from '../hooks/useScore.js'
import { ScoreRing, ScoreBar, TierBadge, Toast } from '../components/UI.jsx'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, TrendingUp, Star, Shield, Info } from 'lucide-react'

const TIER_PERKS = {
  Unranked: ['Basic profile visibility', 'USDC 50 max loan'],
  Bronze:   ['Lender portal visibility', 'USDC 200 max loan', 'Crop insurance eligibility'],
  Silver:   ['Priority lender matching', 'USDC 800 max loan', 'Reduced interest rates', 'Crop insurance + weather index'],
  Gold:     ['Featured farmer status', 'USDC 2,000 max loan', 'Group loan coordination', 'Input supplier credit'],
  Platinum: ['Top-tier farmer badge', 'USDC 5,000 max loan', 'Institutional lender access', 'Export market connections', 'Mentorship programme'],
}

const TIPS = [
  { icon:'🌾', tip:'Log every harvest — even small ones. Frequency matters more than size.' },
  { icon:'💰', tip:'Record all sales immediately after they happen for maximum score impact.' },
  { icon:'📅', tip:'Log entries regularly across months to build "record regularity" points.' },
  { icon:'💸', tip:'Repaying loans on time gives you a +50 score bonus.' },
  { icon:'📊', tip:'Your income growth component rewards increasing total KES income over time.' },
]

export default function CreditScore() {
  const navigate = useNavigate()
  const { state } = useApp()
  const {
    score, tier, breakdown, currency,
    harvests, sales, expenses, totalIncome,
    totalTransactions, streak, cropBreakdown,
  } = useScore()
  const curr = currency?.symbol || 'LOCAL'

  if (!state.farmer) { navigate('/onboard'); return null }

  const nextTierScore = score >= 750 ? 850 : score >= 650 ? 750 : score >= 500 ? 650 : score >= 300 ? 500 : 300
  const nextTierLabel = score >= 750 ? 'Max (Platinum)' : score >= 650 ? 'Platinum' : score >= 500 ? 'Gold' : score >= 300 ? 'Silver' : 'Bronze'
  const progress      = score >= 750 ? 100 : ((score - (score >= 650 ? 650 : score >= 500 ? 500 : score >= 300 ? 300 : 0)) / (nextTierScore - (score >= 650 ? 650 : score >= 500 ? 500 : score >= 300 ? 300 : 0))) * 100

  const radarData = [
    { subject: 'Harvests',    A: (breakdown.freq / 200) * 100 },
    { subject: 'Sales',       A: (breakdown.cons / 200) * 100 },
    { subject: 'Income',      A: (breakdown.grow / 200) * 100 },
    { subject: 'Regularity',  A: (breakdown.reg  / 150) * 100 },
    { subject: 'Base',        A: 100 },
  ]

  const currentPerks = TIER_PERKS[tier.label] || TIER_PERKS.Unranked

  return (
    <div style={{ minHeight: '80vh', padding: '40px 0 60px' }}>
      <Toast />
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="display-md" style={{ marginBottom: 4 }}>Credit Score Report</h1>
          <p style={{ color: 'var(--earth)', fontSize: 14 }}>
            Your on-chain credit profile · Updated with every blockchain entry
          </p>
        </div>

        {/* ── Main Score Card ─────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--soil) 0%, #1a2e14 100%)', color: 'white' }}>
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {/* Custom dark-mode ring */}
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                <svg width={200} height={200} viewBox="0 0 200 200">
                  <circle cx={100} cy={100} r={82} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
                  <circle cx={100} cy={100} r={82} fill="none"
                    stroke={tier.color} strokeWidth={14}
                    strokeDasharray={`${(score / 850) * 2 * Math.PI * 82} ${2 * Math.PI * 82}`}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 1.2s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: tier.color, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>/ 850</div>
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: tier.color }}>{tier.emoji} {tier.label}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Farmer
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--sand,#E8D5B4)' }}>
                  {state.farmer.fname} {state.farmer.lname}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  {state.farmer.county} County · {state.farmer.crop} · {state.farmer.acres} acres
                </div>
              </div>

              {/* Next tier progress */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Progress to {nextTierLabel}</span>
                  <span style={{ fontSize: 12, color: tier.color, fontWeight: 600 }}>{score} / {nextTierScore}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: tier.color, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  {nextTierScore - score > 0 ? `${nextTierScore - score} points to ${nextTierLabel}` : '🎉 Maximum tier reached!'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Entries', val: totalTransactions },
                  { label: 'Active Streak', val: `${streak}d` },
                  { label: 'Max Loan',      val: `USDC ${tier.maxLoan.toLocaleString()}` },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sand,#E8D5B4)' }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier perks */}
            <div style={{ minWidth: 200, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-md)', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                {tier.emoji} {tier.label} Perks
              </div>
              {currentPerks.map(p => (
                <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  <span style={{ color: tier.color, flexShrink: 0 }}>✓</span> {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* ── Score Breakdown ──────────────────────────────────────────── */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              Score Breakdown
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--earth)' }}>Base score</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>100</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '12%' }} />
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
            <ScoreBar label="Harvest frequency"  value={breakdown.freq} max={200} color="var(--leaf)" />
            <ScoreBar label="Sales consistency"   value={breakdown.cons} max={200} color="var(--gold)" />
            <ScoreBar label="Income growth"        value={breakdown.grow} max={200} color="var(--sky,#1565C0)" />
            <ScoreBar label="Record regularity"    value={breakdown.reg}  max={150} color="var(--earth)" />
            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Total Score</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: tier.color }}>{score} / 850</span>
            </div>
          </div>

          {/* ── Radar Chart ──────────────────────────────────────────────── */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              Score Radar
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--earth)' }} />
                <Radar name="Score" dataKey="A" stroke={tier.color} fill={tier.color} fillOpacity={0.15} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ background: 'var(--soil)', border: 'none', borderRadius: 8, color: 'var(--sand)', fontSize: 12 }}
                  formatter={v => [`${v.toFixed(0)}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* ── Farm Stats ───────────────────────────────────────────────── */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              Farm Statistics
            </div>
            {[
              { label: 'Total Harvests Logged', value: harvests.length, color: 'var(--leaf)' },
              { label: 'Total Sales Recorded',  value: sales.length,    color: 'var(--gold)' },
              { label: 'Total Expenses',         value: expenses.length, color: 'var(--earth)' },
              { label: `Total Income (${curr})`,      value: `${curr} ${totalIncome.toLocaleString()}`, color: 'var(--leaf)' },
              { label: 'Total Transactions',      value: totalTransactions,   color: 'var(--sky,#1565C0)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--soil-60)' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* ── Crop Breakdown ───────────────────────────────────────────── */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
              Crop Breakdown
            </div>
            {cropBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--earth)', fontSize: 13 }}>
                Log entries to see crop breakdown
              </div>
            ) : (
              cropBreakdown.map((c, i) => {
                const pct = (c.count / totalTransactions) * 100
                return (
                  <div key={c.crop} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{c.crop}</span>
                      <span style={{ color: 'var(--earth)' }}>{c.count} entries</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: ['var(--leaf)','var(--gold)','var(--sky,#1565C0)','var(--earth)','var(--danger)'][i % 5],
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Tier Comparison ──────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Credit Tier Comparison
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Score Range</th>
                  <th>Max Loan</th>
                  <th>Interest Rate</th>
                  <th>Benefits</th>
                  <th>Your Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier:'Unranked', emoji:'🌱', range:'0–299',  max:'USDC 50',    rate:'—',    benefits:'Basic access', color:'var(--earth)' },
                  { tier:'Bronze',   emoji:'🥉', range:'300–499',max:'USDC 200',   rate:'18%',  benefits:'Lender visibility', color:'#8B4513' },
                  { tier:'Silver',   emoji:'🥈', range:'500–649',max:'USDC 800',   rate:'14%',  benefits:'+ Crop insurance',  color:'#607D8B' },
                  { tier:'Gold',     emoji:'🥇', range:'650–749',max:'USDC 2,000', rate:'10%',  benefits:'+ Group loans',     color:'var(--gold)' },
                  { tier:'Platinum', emoji:'💎', range:'750–850',max:'USDC 5,000', rate:'7%',   benefits:'+ Export markets',  color:'#006064' },
                ].map(r => {
                  const isCurrent = r.tier === tier.label
                  return (
                    <tr key={r.tier} style={{ background: isCurrent ? tier.bg : undefined }}>
                      <td><span style={{ fontWeight: 700, color: r.color }}>{r.emoji} {r.tier}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.range}</td>
                      <td><strong>{r.max}</strong></td>
                      <td>{r.rate}</td>
                      <td style={{ fontSize: 12, color: 'var(--earth)' }}>{r.benefits}</td>
                      <td>
                        {isCurrent
                          ? <span className="badge badge-green">✓ Your tier</span>
                          : score > parseInt(r.range.split('–')[1])
                            ? <span className="badge badge-neutral">Passed</span>
                            : <span className="badge badge-neutral">Upcoming</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Score Improvement Tips ───────────────────────────────────────── */}
        <div className="card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="var(--gold)" />
            </div>
            <div>
              <div className="title-sm">How to improve your score</div>
              <div style={{ fontSize: 12, color: 'var(--earth)' }}>Personalised tips for {state.farmer.fname}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 12 }}>
            {TIPS.map(t => (
              <div key={t.tip} style={{ background: 'var(--parchment)', borderRadius: 'var(--r-md)', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--soil-60)', lineHeight: 1.6 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
                {t.tip}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/log')}>
              Log Entry to Boost Score →
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/loan')}>
              Apply for Loan
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
