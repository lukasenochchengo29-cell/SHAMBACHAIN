import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, scoreToTier } from '../context/AppContext.jsx'
import { useStellar } from '../hooks/useStellar.js'
import { useScore } from '../hooks/useScore.js'
import { StatCard, ScoreRing, ScoreBar, WalletCard, TierBadge, EmptyState, Toast } from '../components/UI.jsx'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  Sprout, TrendingUp, DollarSign, Activity,
  Plus, ExternalLink, FileText, Star, Landmark
} from 'lucide-react'
import { shortKey } from '../utils/stellarUtils.js'

function fmt(n, currency) {
  return `${currency} ${Number(n).toLocaleString()}`
}

function RequireAuth({ children }) {
  const { state } = useApp()
  const navigate  = useNavigate()
  useEffect(() => { if (!state.farmer) navigate('/onboard') }, [state.farmer])
  if (!state.farmer) return null
  return children
}

const COUNTRY_FLAGS = { Kenya:'🇰🇪', Uganda:'🇺🇬', Tanzania:'🇹🇿', Ethiopia:'🇪🇹', Nigeria:'🇳🇬' }

export default function FarmerDashboard() {
  const { state }          = useApp()
  const { refreshBalance } = useStellar()
  const navigate           = useNavigate()
  const {
    score, tier, breakdown, currency,
    harvests, sales, totalIncome, totalExpense,
    harvestChartData, incomeChartData, streak,
    totalTransactions,
  } = useScore()

  useEffect(() => { 
    refreshBalance() 
    // Refresh again after 3 seconds to catch post-transaction balance
    const timer = setTimeout(() => refreshBalance(), 3000)
    return () => clearTimeout(timer)
  }, [])

  const f = state.farmer
  if (!f) return null

  const recentTxns = [...state.transactions].slice(0, 5)
  const activeLoan = state.loans.find(l => l.status === 'Disbursed' || l.status === 'Pending')
  const flag       = COUNTRY_FLAGS[f.country] || '🌍'
  const curr       = currency.symbol

  const statCards = [
    { label:'Total Harvests',  value: harvests.length,                    sub:`${sales.length} sales logged`,              icon: Sprout,     accent:'var(--leaf-ghost)'  },
    { label:'Total Income',    value: fmt(totalIncome, curr),              sub:`Expenses: ${fmt(totalExpense, curr)}`,      icon: DollarSign, accent:'#FFF3CD'            },
    { label:'Active Streak',   value: `${streak} days`,                   sub:`${totalTransactions} total entries`,        icon: Activity,   accent:'#BBDEFB'            },
    { label:'Credit Score',    value: score,                               sub:`${tier.emoji} ${tier.label} tier`,          icon: Star,       accent: tier.bg             },
  ]

  return (
    <RequireAuth>
      <div style={{ minHeight:'80vh', padding:'36px 0 60px' }}>
        <Toast />
        <div className="container">

          {/* Header */}
          <div className="flex-between" style={{ marginBottom:28, flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 className="display-md">
                Habari, {f.fname} {flag} 👋
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, color:'var(--earth)' }}>
                  {f.crop} Farmer · {f.region}, {f.country} · {f.acres} acres
                </span>
                <TierBadge score={score} size="sm" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ gap:8 }}>
              <Plus size={16} /> Log Entry
            </button>
          </div>

          {/* Active loan alert */}
          {activeLoan && (
            <div className="alert alert-gold" style={{ marginBottom:20 }}>
              <DollarSign size={16} />
              <span>
                Active loan of <strong>USDC {activeLoan.amountUsdc}</strong> — status: <strong>{activeLoan.status}</strong>.{' '}
                <button onClick={() => navigate('/loan')} style={{ background:'none', border:'none', color:'inherit', fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>
                  View details
                </button>
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid-mobile" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:16, marginBottom:24 }}>
            {statCards.map((s,i) => (
              <div key={s.label} style={{ animationDelay:`${i*0.07}s` }}>
                <StatCard {...s} />
              </div>
            ))}
          </div>

          {/* Score + Wallet row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }} className="dashboard-main-grid">
            <div className="card">
              <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:20 }}>Credit Score</div>
              <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <ScoreRing score={score} size={160} strokeWidth={12} />
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:13, color:'var(--earth)', marginBottom:14 }}>Score breakdown</div>
                  <ScoreBar label="Harvest frequency"  value={breakdown.freq} max={200} />
                  <ScoreBar label="Sales consistency"   value={breakdown.cons} max={200} />
                  <ScoreBar label="Income growth"        value={breakdown.grow} max={200} />
                  <ScoreBar label="Record regularity"    value={breakdown.reg}  max={150} />
                  <div style={{ height:1, background:'var(--border)', margin:'12px 0' }} />
                  <div style={{ fontSize:11, color:'var(--earth)', marginTop:8 }}>
                    Next tier at: <strong>{score>=750?'850 (max)':score>=650?'750':score>=500?'650':score>=300?'500':'300'}</strong>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ marginTop:12, width:'100%' }} onClick={() => navigate('/credit-score')}>
                    View full report <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <WalletCard
                publicKey={state.keypair?.publicKey || ''}
                balance={state.xlmBalance !== null ? state.xlmBalance : 'Loading…'}
                farmerName={`${f.fname} ${f.lname}`}
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Log Harvest',  icon: Sprout,   path:'/log',          bg:'var(--leaf-ghost)', color:'var(--leaf)'  },
                  { label:'Credit Score', icon: Star,     path:'/credit-score', bg:'#FFF3CD',           color:'var(--gold)'  },
                  { label:'Apply Loan',   icon: Landmark, path:'/loan',         bg:'#BBDEFB',           color:'var(--sky)'   },
                  { label:'History',      icon: FileText, path:'/transactions', bg:'var(--parchment)',  color:'var(--earth)' },
                ].map(btn => (
                  <button key={btn.label} onClick={() => navigate(btn.path)} style={{
                    background:btn.bg, border:'1px solid rgba(0,0,0,0.06)',
                    borderRadius:'var(--r-md)', padding:'14px 12px',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                    cursor:'pointer', transition:'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='none'}
                  >
                    <btn.icon size={18} color={btn.color} />
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--soil)' }}>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }} className="dashboard-main-grid">
            <div className="card">
              <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:20 }}>
                Harvest History (kg)
              </div>
              {harvestChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={harvestChartData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--earth)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:11, fill:'var(--earth)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:'var(--soil)', border:'none', borderRadius:8, color:'var(--sand)', fontSize:12 }} cursor={{ fill:'rgba(27,94,59,0.08)' }} />
                    <Bar dataKey="kg" fill="var(--leaf-bright,#4CAF77)" radius={[4,4,0,0]} name="Harvest (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={Sprout} title="No harvests yet" description="Log your first harvest to see the chart" action={() => navigate('/log')} actionLabel="Log harvest" />
              )}
            </div>

            <div className="card">
              <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:20 }}>
                Income Trend ({curr})
              </div>
              {incomeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={incomeChartData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C07800" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#C07800" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--earth)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:11, fill:'var(--earth)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:'var(--soil)', border:'none', borderRadius:8, color:'var(--sand)', fontSize:12 }} formatter={v => [`${curr} ${v.toLocaleString()}`, 'Income']} />
                    <Area dataKey="value" stroke="var(--gold,#C07800)" fill="url(#incomeGrad)" strokeWidth={2} name={`Income (${curr})`} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={TrendingUp} title="No sales yet" description="Log sales to see income trend" action={() => navigate('/log')} actionLabel="Log sale" />
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Recent Blockchain Entries
              </div>
              {state.transactions.length > 5 && (
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transactions')}>
                  View all ({state.transactions.length})
                </button>
              )}
            </div>
            {recentTxns.length === 0 ? (
              <EmptyState icon={FileText} title="No transactions yet" description="Log your first harvest, sale, or expense to create your on-chain record." action={() => navigate('/log')} actionLabel="Log first entry" />
            ) : (
              <div className="sc-table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Type</th><th>Crop</th><th>Quantity</th><th>Value</th><th>Date</th><th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        <span className={`badge ${tx.type==='harvest'?'badge-green':tx.type==='sale'?'badge-gold':'badge-neutral'}`}>
                          {tx.type==='harvest'?'🌾':tx.type==='sale'?'💰':'🧾'} {tx.type}
                        </span>
                      </td>
                      <td>{tx.crop}</td>
                      <td>{tx.qty ? `${tx.qty} kg` : '—'}</td>
                      <td><strong>{fmt(tx.value, curr)}</strong></td>
                      <td>{tx.date}</td>
                      <td><span className="mono" style={{ color:'var(--leaf)', cursor:'pointer' }} title={tx.hash}>{tx.hash?.slice(0,10)}…</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </RequireAuth>
  )
}