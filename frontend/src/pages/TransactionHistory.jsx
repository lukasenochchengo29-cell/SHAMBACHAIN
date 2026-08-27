import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useScore } from '../hooks/useScore.js'
import { EmptyState, Toast } from '../components/UI.jsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  ArrowLeft, Search, Download, ExternalLink,
  Sprout, DollarSign, Receipt, Filter
} from 'lucide-react'

export default function TransactionHistory() {
  const navigate                    = useNavigate()
  const { state }                   = useApp()
  const { currency }                = useScore()
  const curr                        = currency?.symbol || 'LOCAL'

  const [search,      setSearch]    = useState('')
  const [filterType,  setFilterType]= useState('all')
  const [filterCrop,  setFilterCrop]= useState('all')
  const [sortDir,     setSortDir]   = useState('desc')
  const [expanded,    setExpanded]  = useState(null)

  if (!state.farmer) { navigate('/onboard'); return null }

  const txns = state.transactions

  // Unique crops
  const crops = useMemo(() => {
    const s = new Set(txns.map(t => t.crop))
    return ['all', ...Array.from(s)]
  }, [txns])

  const filtered = useMemo(() => {
    return txns
      .filter(t => {
        const matchSearch = !search ||
          t.crop?.toLowerCase().includes(search.toLowerCase()) ||
          t.notes?.toLowerCase().includes(search.toLowerCase()) ||
          t.hash?.toLowerCase().includes(search.toLowerCase())
        const matchType = filterType === 'all' || t.type === filterType
        const matchCrop = filterCrop === 'all' || t.crop === filterCrop
        return matchSearch && matchType && matchCrop
      })
      .sort((a, b) =>
        sortDir === 'desc'
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
      )
  }, [txns, search, filterType, filterCrop, sortDir])

  // Summary stats
  const totalHarvest = txns.filter(t => t.type === 'harvest').reduce((s, t) => s + (t.qty || 0), 0)
  const totalIncome  = txns.filter(t => t.type === 'sale').reduce((s, t)    => s + (t.value || 0), 0)
  const totalExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.value || 0), 0)

  // Monthly volume for chart
  const monthlyData = useMemo(() => {
    const m = {}
    txns.forEach(t => {
      const key = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' })
      if (!m[key]) m[key] = { month: key, harvest: 0, sale: 0, expense: 0 }
      m[key][t.type] = (m[key][t.type] || 0) + (t.value || 0)
    })
    return Object.values(m).slice(-8)
  }, [txns])

  // Verification badge
  function VerifBadge({ status }) {
    if (status === 'AgentVerified')  return <span title="Agent counter-signed" style={{ color:'var(--leaf)', fontWeight:600, fontSize:11 }}>🟢 Agent</span>
    if (status === 'SatelliteMatch') return <span title="Satellite confirmed" style={{ color:'#1565C0', fontWeight:600, fontSize:11 }}>🛰️ Satellite</span>
    if (status === 'Flagged')        return <span title="Flagged for review" style={{ color:'var(--danger,#C62828)', fontWeight:600, fontSize:11 }}>🔴 Flagged</span>
    return <span title="Self-reported" style={{ color:'var(--earth)', fontSize:11 }}>🟡 Self</span>
  }

  function exportCSV() {
    const headers = ['Type','Crop','Qty (kg)','Value','Verification','Date','TX Hash']
    const rows    = filtered.map(t => [
      t.type, t.crop, t.qty || 0, t.value, t.verification || 'SelfReported', t.date,
      (t.notes || '').replace(/,/g, ''), t.hash,
    ])
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `shambachain-ledger-${state.farmer.fname}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const typeIcon  = { harvest: Sprout, sale: DollarSign, expense: Receipt }
  const typeBadge = { harvest: 'badge-green', sale: 'badge-gold', expense: 'badge-neutral' }
  const typeColor = { harvest: 'var(--leaf)', sale: 'var(--gold)', expense: 'var(--earth)' }

  return (
    <div style={{ minHeight:'80vh', padding:'40px 0 60px' }}>
      <Toast />
      <div className="container">

        {/* Header */}
        <div className="flex-between" style={{ marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ gap:6, marginBottom:16 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="display-md" style={{ marginBottom:4 }}>Transaction History</h1>
            <p style={{ color:'var(--earth)', fontSize:14 }}>
              Your complete on-chain ledger · {txns.length} entries on Stellar Testnet
            </p>
          </div>
          <button className="btn btn-outline" onClick={exportCSV} style={{ gap:8 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:24 }}>
          {[
            { label:'Total Entries',    val: txns.length,                                  color:'var(--soil)',  bg:'var(--parchment)' },
            { label:'Total Harvested',  val: `${totalHarvest.toLocaleString()} kg`,        color:'var(--leaf)',  bg:'var(--leaf-ghost)' },
            { label:'Total Income',     val: `${curr} ${totalIncome.toLocaleString()}`,    color:'var(--gold)',  bg:'var(--gold-pale)'  },
            { label:'Total Expenses',   val: `${curr} ${totalExpense.toLocaleString()}`,   color:'var(--earth)', bg:'var(--parchment)' },
            { label:'Net (Income–Exp)', val: `${curr} ${(totalIncome - totalExpense).toLocaleString()}`,
              color: totalIncome >= totalExpense ? 'var(--leaf)' : 'var(--danger,#C62828)',
              bg: 'var(--leaf-ghost)' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:'var(--r-md)', padding:'14px 16px', border:'1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:11, color:'var(--earth)', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        {monthlyData.length > 0 && (
          <div className="card" style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:16 }}>
              Monthly Activity ({curr})
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--earth)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--earth)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'var(--soil)', border:'none', borderRadius:8, color:'var(--sand)', fontSize:12 }}
                  formatter={v => [`${curr} ${v.toLocaleString()}`, '']}
                />
                <Bar dataKey="harvest" name="Harvest Value" fill="var(--leaf-bright,#4CAF77)" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="sale"    name="Sales"         fill="var(--gold,#C07800)"         radius={[3,3,0,0]} stackId="b" />
                <Bar dataKey="expense" name="Expenses"      fill="var(--clay,#C49A6C)"          radius={[3,3,0,0]} stackId="c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={14} color="var(--earth)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input
              className="form-input"
              placeholder="Search crop, notes or hash…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:36 }}
            />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['all','harvest','sale','expense'].map(type => (
              <button key={type} onClick={() => setFilterType(type)} style={{
                padding:'8px 12px', borderRadius:'var(--r-full)', fontSize:12,
                border:`1.5px solid ${filterType === type ? 'var(--leaf)' : 'var(--border)'}`,
                background: filterType === type ? 'var(--leaf-ghost)' : 'var(--white)',
                color: filterType === type ? 'var(--leaf)' : 'var(--earth)',
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', textTransform:'capitalize',
              }}>
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
          <select className="form-input" style={{ width:'auto', minWidth:130 }} value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
            {crops.map(c => <option key={c} value={c}>{c === 'all' ? 'All Crops' : c}</option>)}
          </select>
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} className="btn btn-ghost btn-sm" style={{ gap:5 }}>
            <Filter size={12} /> {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        {/* Table */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--earth)' }}>
            Showing {filtered.length} of {txns.length} entries
          </div>

          {filtered.length === 0 ? (
            txns.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No blockchain entries yet"
                description="Log your first harvest, sale, or expense to create your on-chain record."
                action={() => navigate('/log')}
                actionLabel="Log first entry"
              />
            ) : (
              <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--earth)', fontSize:14 }}>
                No entries match your filters.
              </div>
            )
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Crop</th>
                    <th>Qty (kg)</th>
                    <th>Value</th>
                    <th>Verification</th>
                    <th>Date</th>
                    <th>Stellar Tx Hash</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => {
                    const Icon = typeIcon[tx.type] || Sprout
                    const isExp = expanded === tx.id
                    return (
                      <React.Fragment key={tx.id}>
                        <tr style={{ cursor:'pointer' }} onClick={() => setExpanded(isExp ? null : tx.id)}>
                          <td style={{ fontSize:11, color:'var(--earth)' }}>{filtered.length - i}</td>
                          <td>
                            <span className={`badge ${typeBadge[tx.type] || 'badge-neutral'}`} style={{ gap:5 }}>
                              <Icon size={11} color={typeColor[tx.type]} /> {tx.type}
                            </span>
                          </td>
                          <td style={{ fontWeight:500 }}>{tx.crop}</td>
                          <td>{tx.qty ? `${tx.qty.toLocaleString()} kg` : '—'}</td>
                          <td><strong style={{ color: typeColor[tx.type] }}>{curr} {(tx.value || 0).toLocaleString()}</strong></td>
                          <td><VerifBadge status={tx.verification} /></td>
                          <td style={{ fontSize:12, color:'var(--earth)' }}>{tx.date}</td>
                          <td>
                            <span className="mono" style={{ color:'var(--leaf)', cursor:'pointer' }} title={tx.hash}>
                              {tx.hash?.slice(0,12)}…
                            </span>
                          </td>
                          <td>
                            <ExternalLink
                              size={13} color="var(--earth)" style={{ cursor:'pointer' }}
                              title="View on Stellar Expert"
                              onClick={e => {
                                e.stopPropagation()
                                window.open(`https://stellar.expert/explorer/testnet/tx/${tx.hash}`, '_blank')
                              }}
                            />
                          </td>
                        </tr>
                        {isExp && (
                          <tr>
                            <td colSpan={9} style={{ background:'var(--parchment)', padding:'12px 16px' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                                <div>
                                  <div style={{ fontSize:11, color:'var(--earth)', marginBottom:2 }}>Full TX Hash</div>
                                  <div className="mono" style={{ color:'var(--leaf)', wordBreak:'break-all', fontSize:11 }}>{tx.hash}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:11, color:'var(--earth)', marginBottom:2 }}>Notes</div>
                                  <div style={{ fontSize:12 }}>{tx.notes || 'No notes'}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:11, color:'var(--earth)', marginBottom:2 }}>Verification status</div>
                                  <div style={{ fontSize:12 }}><VerifBadge status={tx.verification} /></div>
                                </div>
                                <div>
                                  <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="btn btn-outline btn-sm"
                                    style={{ display:'inline-flex', gap:6, textDecoration:'none' }}
                                  >
                                    <ExternalLink size={12} /> View on Stellar Expert
                                  </a>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}