import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, scoreToTier } from '../context/AppContext.jsx'
import { useScore } from '../hooks/useScore.js'
import { useStellar } from '../hooks/useStellar.js'
import { TierBadge, Toast, StepLoader } from '../components/UI.jsx'
import {
  Search, CheckCircle, X, DollarSign, Users,
  TrendingUp, Shield, MessageSquare, Send, Bell,
  Clock, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'

const DISBURSE_STEPS = [
  'Verifying loan details…',
  'Signing Stellar transaction…',
  'Disbursing USDC to farmer wallet…',
]

const COUNTRY_FLAG = c =>
  c === 'Kenya' ? '🇰🇪' : c === 'Uganda' ? '🇺🇬' : c === 'Tanzania' ? '🇹🇿' : c === 'Ethiopia' ? '🇪🇹' : c === 'Nigeria' ? '🇳🇬' : '🌍'

// ── Seed messages for demo farmers ───────────────────────────────────────
const SEED_MSGS = {
  L1: [
    { id:1, from:'lender', text:'Hello Wanjiku, your Gold tier loan of USDC 500 has been disbursed to your Stellar wallet. Please confirm receipt.', ts:'2025-05-01 09:12', read:true },
    { id:2, from:'farmer', text:'Thank you! I have received the funds. I will begin purchasing seeds this week.', ts:'2025-05-01 10:34', read:true },
    { id:3, from:'lender', text:'Great! Your first repayment of USDC 90 is due on 1 June. Please confirm when ready.', ts:'2025-05-15 11:00', read:true },
  ],
  L2: [
    { id:1, from:'lender', text:'Kipchoge, your loan repayment of USDC 120 was due 3 days ago. Please confirm when you will pay.', ts:'2025-05-28 08:00', read:false },
    { id:2, from:'farmer', text:'I apologise for the delay. I had a poor harvest this week. I will pay by end of month.', ts:'2025-05-28 14:22', read:true },
    { id:3, from:'lender', text:'Thank you for letting us know. Please ensure payment by 31 May to avoid a late mark on your score.', ts:'2025-05-28 15:00', read:false },
  ],
  L7: [
    { id:1, from:'lender', text:'Hello Chinyere, we noticed you qualify for a Gold tier loan. Would you like to apply?', ts:'2025-05-20 10:00', read:true },
    { id:2, from:'farmer', text:'Yes, I am interested. I need funds for cassava processing equipment.', ts:'2025-05-20 12:15', read:true },
  ],
}

// Quick-reply templates lenders commonly send
const QUICK_REPLIES = [
  { label:'Loan disbursed',      text:'Your loan has been disbursed to your Stellar wallet. Please confirm receipt.' },
  { label:'Payment reminder',    text:'This is a friendly reminder that your repayment is due soon. Please confirm when you will pay.' },
  { label:'Overdue notice',      text:'Your loan repayment is now overdue. Please make payment as soon as possible to protect your credit score.' },
  { label:'Loan approved',       text:'Congratulations! Your loan application has been approved. Funds will be sent to your wallet shortly.' },
  { label:'Request documents',   text:'Please log more harvest entries on ShambaChain so we can review your updated credit profile.' },
  { label:'Score improved',      text:'Great news — your credit score has improved! You may now be eligible for a higher loan amount.' },
]

export default function LenderPortal() {
  const navigate            = useNavigate()
  const { state, notify }   = useApp()
  const { score: liveScore, tier: liveTier } = useScore()
  const { loading, step, approveLoan }        = useStellar()

  // ── UI state ──────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [filterTier,  setFilterTier]  = useState('All')
  const [loanModal,   setLoanModal]   = useState(null)   // farmer object or null
  const [loanForm,    setLoanForm]    = useState({ amount: '', period: '6' })
  const [loanErrors,  setLoanErrors]  = useState({})
  const [disbursed,   setDisbursed]   = useState(null)

  // ── Messaging state ───────────────────────────────────────────────────
  const [msgPanel,    setMsgPanel]    = useState(null)   // farmer object or null
  const [messages,    setMessages]    = useState(SEED_MSGS)  // { farmerId: [{...}] }
  const [newMsg,      setNewMsg]      = useState('')
  const [showQuick,   setShowQuick]   = useState(false)
  const msgEndRef = useRef(null)

  // ── Close modal on Escape ─────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setLoanModal(null); setMsgPanel(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Scroll messages to bottom ─────────────────────────────────────────
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgPanel, messages])

  // ── Farmers data ──────────────────────────────────────────────────────
  const allFarmers = state.lenderFarmers.map(f => {
    if (f.isLive && state.farmer) {
      return {
        ...f,
        score:  liveScore,
        tier:   liveTier.label,
        txns:   state.transactions.length,
        income: state.transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.value, 0),
      }
    }
    return f
  })

  const filtered = allFarmers.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      f.name.toLowerCase().includes(q) ||
      (f.country || '').toLowerCase().includes(q) ||
      (f.region || f.county || '').toLowerCase().includes(q) ||
      (f.crop || '').toLowerCase().includes(q)
    return matchSearch && (filterTier === 'All' || f.tier === filterTier)
  })

  const avgScore  = Math.round(allFarmers.reduce((s, f) => s + f.score, 0) / (allFarmers.length || 1))
  const loansActive = allFarmers.filter(f => f.loan).length

  // Unread message count per farmer
  function unreadCount(farmerId) {
    return (messages[farmerId] || []).filter(m => m.from === 'farmer' && !m.read).length
  }
  const totalUnread = allFarmers.reduce((s, f) => s + unreadCount(f.id), 0)

  // ── Disburse loan ─────────────────────────────────────────────────────
  async function handleDisburse() {
    const e   = {}
    const amt = Number(loanForm.amount)
    if (!amt || amt <= 0)              e.amount = 'Enter a valid amount'
    else if (amt > loanModal.maxLoan)  e.amount = `Max for this tier: USDC ${loanModal.maxLoan}`
    setLoanErrors(e)
    if (Object.keys(e).length) return

    const res = await approveLoan(`LENDER-${Date.now()}`, amt)
    if (res.success) {
      setDisbursed({ farmer: loanModal.name, farmerId: loanModal.id, amount: amt, hash: res.hash })
      // Auto-send a loan disbursed message
      sendSystemMessage(loanModal.id,
        `Your loan of USDC ${amt} has been disbursed to your Stellar wallet (${loanModal.publicKey || 'G…XXXXX'}). Please confirm receipt in your ShambaChain dashboard.`
      )
      setLoanModal(null)
    }
  }

  function openLoanModal(farmer) {
    const tier = scoreToTier(farmer.score)
    setLoanModal({ ...farmer, maxLoan: tier.maxLoan, tierObj: tier })
    setLoanForm({ amount: '', period: '6' })
    setLoanErrors({})
  }

  // ── Messaging ─────────────────────────────────────────────────────────
  function openMessages(farmer) {
    // Mark all farmer messages as read
    setMessages(prev => ({
      ...prev,
      [farmer.id]: (prev[farmer.id] || []).map(m => ({ ...m, read: true })),
    }))
    setMsgPanel(farmer)
    setNewMsg('')
    setShowQuick(false)
  }

  function sendMessage(text) {
    if (!text.trim() || !msgPanel) return
    const msg = {
      id:   Date.now(),
      from: 'lender',
      text: text.trim(),
      ts:   new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).replace(',', ''),
      read: true,
    }
    setMessages(prev => ({
      ...prev,
      [msgPanel.id]: [...(prev[msgPanel.id] || []), msg],
    }))
    setNewMsg('')
    setShowQuick(false)
    notify('success', `Message sent to ${msgPanel.name}`)
  }

  function sendSystemMessage(farmerId, text) {
    const msg = {
      id:   Date.now(),
      from: 'lender',
      text,
      ts:   new Date().toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).replace(',', ''),
      read: true,
      isSystem: true,
    }
    setMessages(prev => ({
      ...prev,
      [farmerId]: [...(prev[farmerId] || []), msg],
    }))
  }

  const TIERS = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Unranked']

  if (loading) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card" style={{ maxWidth:420, width:'100%', padding:0, overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(135deg, #1565C0 0%, var(--soil) 100%)', padding:24, textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:4 }}>🏦</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'white' }}>Disbursing USDC on Stellar</div>
          </div>
          <StepLoader steps={DISBURSE_STEPS} currentStep={step} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'80vh', padding:'40px 0 60px' }}>
      <Toast />

      {/* ══════════════════ DISBURSE MODAL OVERLAY ══════════════════════ */}
      {loanModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setLoanModal(null) }}
          style={{
            position:'fixed', inset:0, zIndex:1000,
            background:'rgba(28,18,9,0.55)',
            backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:24,
          }}
        >
          <div className="animate-scaleIn" style={{
            background:'white', borderRadius:20,
            width:'100%', maxWidth:540,
            boxShadow:'0 24px 80px rgba(0,0,0,0.25)',
            overflow:'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              background:'linear-gradient(135deg, #0D3B28 0%, #1C1209 100%)',
              padding:'20px 24px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:40, height:40, borderRadius:'50%',
                  background: scoreToTier(loanModal.score).bg,
                  color: scoreToTier(loanModal.score).color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700,
                }}>
                  {loanModal.avatar}
                </div>
                <div>
                  <div style={{ fontSize:11, color:'rgba(232,213,180,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    🏦 USDC DISBURSEMENT
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'white' }}>
                    Disburse to {loanModal.name}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(232,213,180,0.55)', marginTop:2 }}>
                    Score: <strong style={{ color: scoreToTier(loanModal.score).color }}>{loanModal.score}</strong>
                    {' '}· Max: <strong style={{ color:'#F0C040' }}>USDC {loanModal.maxLoan.toLocaleString()}</strong>
                    {' '}· {COUNTRY_FLAG(loanModal.country)} {loanModal.country}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLoanModal(null)}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:32, height:32, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding:24 }}>
              <div className="input-grid-2" style={{ marginBottom:16 }}>
                <div className="form-group">
                  <label className="form-label">Loan amount (USDC) *</label>
                  <input
                    className={`form-input ${loanErrors.amount ? 'error' : ''}`}
                    type="number"
                    placeholder={`e.g. 500 (max ${loanModal.maxLoan})`}
                    value={loanForm.amount}
                    onChange={e => { setLoanForm(f => ({ ...f, amount: e.target.value })); setLoanErrors({}) }}
                    autoFocus
                  />
                  {loanErrors.amount && <span className="form-error">{loanErrors.amount}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Repayment period</label>
                  <select className="form-input" value={loanForm.period} onChange={e => setLoanForm(f => ({ ...f, period: e.target.value }))}>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
              </div>

              {/* USDC destination info */}
              <div style={{ background:'var(--leaf-ghost)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--leaf)', lineHeight:1.65, marginBottom:20 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>💸 Where does the USDC go?</div>
                The loan is sent directly to <strong>{loanModal.name}'s</strong> unique Stellar wallet address generated at registration.
                Funds appear in their ShambaChain dashboard instantly.
                A notification message will be sent to {loanModal.name.split(' ')[0]} automatically.
                <br /><br />
                <span style={{ fontSize:11, opacity:0.75 }}>
                  ⛓️ Testnet: simulated USDC · Mainnet: real Circle USDC in ~5 seconds
                </span>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" onClick={() => setLoanModal(null)} style={{ minWidth:90 }}>
                  Cancel
                </button>
                <button
                  className="btn btn-gold"
                  style={{ flex:1, fontSize:15 }}
                  onClick={handleDisburse}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner" /> Disbursing…</>
                    : `Disburse USDC ${loanForm.amount || '—'} on Stellar →`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MESSAGE MODAL OVERLAY ════════════════════════ */}
      {msgPanel && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setMsgPanel(null) }}
          style={{
            position:'fixed', inset:0, zIndex:1000,
            background:'rgba(28,18,9,0.55)',
            backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:24,
          }}
        >
          <div className="animate-scaleIn" style={{
            background:'white', borderRadius:20,
            width:'100%', maxWidth:560,
            height:'min(600px, 85vh)',
            boxShadow:'0 24px 80px rgba(0,0,0,0.25)',
            display:'flex', flexDirection:'column',
            overflow:'hidden',
          }}>
            {/* Chat header */}
            <div style={{
              background:'linear-gradient(135deg, #0D3B28 0%, #1C1209 100%)',
              padding:'16px 20px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:38, height:38, borderRadius:'50%',
                  background: scoreToTier(msgPanel.score).bg,
                  color: scoreToTier(msgPanel.score).color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, flexShrink:0,
                }}>
                  {msgPanel.avatar}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'white' }}>{msgPanel.name}</div>
                  <div style={{ fontSize:11, color:'rgba(232,213,180,0.5)' }}>
                    {COUNTRY_FLAG(msgPanel.country)} {msgPanel.country} · {msgPanel.crop} ·{' '}
                    <span style={{ color: scoreToTier(msgPanel.score).color }}>
                      {scoreToTier(msgPanel.score).emoji} {msgPanel.tier}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {/* Overdue alert if farmer has active loan */}
                {msgPanel.loan && (
                  <div style={{
                    display:'flex', alignItems:'center', gap:5,
                    background:'rgba(198,40,40,0.2)', color:'#FFCDD2',
                    padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:600,
                  }}>
                    <AlertTriangle size={11} /> Active Loan
                  </div>
                )}
                <button
                  onClick={() => setMsgPanel(null)}
                  style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:30, height:30, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', background:'#F9F5EE', display:'flex', flexDirection:'column', gap:10 }}>
              {(messages[msgPanel.id] || []).length === 0 && (
                <div style={{ textAlign:'center', color:'var(--earth)', fontSize:13, padding:'32px 0' }}>
                  No messages yet. Send the first message to {msgPanel.name.split(' ')[0]}.
                </div>
              )}
              {(messages[msgPanel.id] || []).map(msg => (
                <div key={msg.id} style={{
                  display:'flex',
                  justifyContent: msg.from === 'lender' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.from === 'farmer' && (
                    <div style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background: scoreToTier(msgPanel.score).bg,
                      color: scoreToTier(msgPanel.score).color,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:700, marginRight:8, alignSelf:'flex-end',
                    }}>
                      {msgPanel.avatar}
                    </div>
                  )}
                  <div style={{ maxWidth:'72%' }}>
                    <div style={{
                      background: msg.from === 'lender'
                        ? (msg.isSystem ? '#E8F5E9' : 'var(--leaf)')
                        : 'white',
                      color: msg.from === 'lender'
                        ? (msg.isSystem ? '#2E7D32' : 'white')
                        : 'var(--soil)',
                      padding:'10px 14px',
                      borderRadius: msg.from === 'lender'
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      fontSize:13, lineHeight:1.55,
                      border: msg.from === 'farmer' ? '1px solid var(--border)' : 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      {msg.isSystem && (
                        <div style={{ fontSize:10, fontWeight:700, opacity:0.7, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                          ⛓️ System · Auto-sent
                        </div>
                      )}
                      {msg.text}
                    </div>
                    <div style={{ fontSize:10, color:'var(--earth)', marginTop:3, textAlign: msg.from === 'lender' ? 'right' : 'left', opacity:0.6 }}>
                      {msg.ts}
                      {msg.from === 'lender' && <span style={{ marginLeft:4 }}>{msg.read ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* Quick reply templates */}
            {showQuick && (
              <div style={{ borderTop:'1px solid var(--border)', background:'var(--parchment)', padding:'10px 14px', flexShrink:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>
                  Quick replies
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {QUICK_REPLIES.map(q => (
                    <button key={q.label} onClick={() => { setNewMsg(q.text); setShowQuick(false) }} style={{
                      background:'white', border:'1px solid var(--border)',
                      borderRadius:999, padding:'5px 12px', fontSize:11, fontWeight:500,
                      color:'var(--soil)', cursor:'pointer', transition:'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--leaf-ghost)'; e.currentTarget.style.borderColor='var(--leaf)'; e.currentTarget.style.color='var(--leaf)' }}
                      onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--soil)' }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <div style={{ borderTop:'1px solid var(--border)', padding:'12px 14px', background:'white', flexShrink:0, display:'flex', gap:8, alignItems:'flex-end' }}>
              <button
                onClick={() => setShowQuick(s => !s)}
                title="Quick replies"
                style={{
                  background: showQuick ? 'var(--leaf-ghost)' : 'var(--parchment)',
                  border:`1px solid ${showQuick ? 'var(--leaf)' : 'var(--border)'}`,
                  borderRadius:10, width:38, height:38, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, color: showQuick ? 'var(--leaf)' : 'var(--earth)',
                  transition:'all 0.15s',
                }}
              >
                <Bell size={15} />
              </button>
              <textarea
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(newMsg) } }}
                placeholder={`Message ${msgPanel.name.split(' ')[0]}… (Enter to send)`}
                rows={2}
                style={{
                  flex:1, padding:'9px 12px', borderRadius:10,
                  border:'1.5px solid var(--border)', fontFamily:'inherit',
                  fontSize:13, color:'var(--soil)', resize:'none', outline:'none',
                  transition:'border-color 0.15s', lineHeight:1.5,
                }}
                onFocus={e => e.target.style.borderColor='var(--leaf-mid,#2D7D52)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
              <button
                onClick={() => sendMessage(newMsg)}
                disabled={!newMsg.trim()}
                style={{
                  background: newMsg.trim() ? 'var(--leaf)' : 'var(--sand)',
                  border:'none', borderRadius:10, width:38, height:38,
                  cursor: newMsg.trim() ? 'pointer' : 'default',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'all 0.15s',
                }}
              >
                <Send size={15} color={newMsg.trim() ? 'white' : 'var(--earth)'} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MAIN PAGE CONTENT ════════════════════════════ */}
      <div className="container">

        {/* Header */}
        <div className="flex-between" style={{ marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'#BBDEFB', border:'1px solid rgba(21,101,192,0.2)',
              color:'#1565C0', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:600, marginBottom:10,
            }}>
              🏦 LENDER PORTAL · STELLAR TESTNET
            </div>
            <h1 className="display-md" style={{ marginBottom:4 }}>Verified Farmer Profiles</h1>
            <p style={{ color:'var(--earth)', fontSize:14 }}>Blockchain-verified credit scores from ShambaChain smart contract</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {totalUnread > 0 && (
              <div style={{
                display:'flex', alignItems:'center', gap:6,
                background:'#FFEBEE', border:'1px solid rgba(198,40,40,0.2)',
                color:'#C62828', padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:600,
              }}>
                <MessageSquare size={14} />
                {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
              </div>
            )}
            {!state.farmer && (
              <button className="btn btn-primary" onClick={() => navigate('/onboard')}>
                Register as Farmer →
              </button>
            )}
          </div>
        </div>

        {/* Disbursement success */}
        {disbursed && (
          <div className="alert alert-green" style={{ marginBottom:20 }}>
            <CheckCircle size={16} />
            <div>
              <strong>USDC {disbursed.amount} disbursed</strong> to {disbursed.farmer} ·{' '}
              <span style={{ fontFamily:'monospace', fontSize:11 }}>Tx: {disbursed.hash?.slice(0, 18)}…</span>
              {' '}·{' '}
              <button onClick={() => { const f = allFarmers.find(x => x.id === disbursed.farmerId); if (f) openMessages(f) }}
                style={{ background:'none', border:'none', color:'inherit', fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>
                Message farmer
              </button>
            </div>
            <button onClick={() => setDisbursed(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', marginLeft:'auto' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px,1fr))', gap:16, marginBottom:28 }}>
          {[
            { label:'Registered Farmers',  val: allFarmers.length,  icon: Users,          bg:'var(--leaf-ghost)',  color:'var(--leaf)'       },
            { label:'Portfolio Income',     val: allFarmers.reduce((s,f) => s+(f.income||0),0).toLocaleString()+' (local)', icon: DollarSign, bg:'var(--gold-pale)', color:'var(--gold)' },
            { label:'Average Credit Score', val: avgScore || '—',   icon: TrendingUp,      bg:'#BBDEFB',           color:'#1565C0'            },
            { label:'Active Loans',         val: loansActive,        icon: Shield,          bg:'var(--parchment)',  color:'var(--earth)'      },
            { label:'Unread Messages',      val: totalUnread || 0,   icon: MessageSquare,   bg:totalUnread?'#FFEBEE':'var(--parchment)', color:totalUnread?'#C62828':'var(--earth)' },
          ].map(s => (
            <div key={s.label} className="card animate-fadeUp" style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ width:42, height:42, borderRadius:'var(--r-md)', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={17} color={s.color} />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--earth)', marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} color="var(--earth)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input className="form-input" placeholder="Search by name, country or crop…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:36 }} />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {TIERS.map(t => (
              <button key={t} onClick={() => setFilterTier(t)} style={{
                padding:'8px 14px', borderRadius:999, fontSize:12, fontWeight:500,
                border:`1.5px solid ${filterTier === t ? 'var(--leaf)' : 'var(--border)'}`,
                background: filterTier === t ? 'var(--leaf-ghost)' : 'var(--white)',
                color: filterTier === t ? 'var(--leaf)' : 'var(--earth)',
                cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit',
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Farmer table */}
        <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:24 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Farmer Credit Profiles
            </div>
            <div style={{ fontSize:12, color:'var(--earth)' }}>{filtered.length} farmers</div>
          </div>
           
          <div className="sc-table-wrap">  
          <table className="sc-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Country</th>
                <th>Crop</th>
                <th>Credit Score</th>
                <th>Tier</th>
                <th>Income</th>
                <th>Entries</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(farmer => {
                const t       = scoreToTier(farmer.score)
                const unread  = unreadCount(farmer.id)
                const msgList = messages[farmer.id] || []
                const lastMsg = msgList[msgList.length - 1]
                return (
                  <tr key={farmer.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:36, height:36, borderRadius:'50%',
                          background:t.bg, color:t.color,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, flexShrink:0,
                          border:`1.5px solid ${t.color}33`,
                        }}>
                          {farmer.avatar}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{farmer.name}</div>
                          {farmer.isLive
                            ? <div style={{ fontSize:10, color:'var(--leaf)', fontWeight:600 }}>🔴 LIVE</div>
                            : lastMsg
                              ? <div style={{ fontSize:10, color: unread ? '#C62828' : 'var(--earth)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {unread ? `💬 ${unread} new` : `💬 ${lastMsg.text.slice(0,28)}…`}
                                </div>
                              : null
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:15 }}>{COUNTRY_FLAG(farmer.country)}</span>
                        <div>
                          <div style={{ fontSize:12, fontWeight:500 }}>{farmer.country}</div>
                          <div style={{ fontSize:10, color:'var(--earth)' }}>{farmer.region || farmer.county || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="crop-chip">{farmer.crop}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:56, height:5, background:'var(--sand)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${(farmer.score/850)*100}%`, background:t.color, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:700, color:t.color }}>{farmer.score}</span>
                      </div>
                    </td>
                    <td><TierBadge score={farmer.score} size="sm" /></td>
                    <td style={{ fontSize:12, color:'var(--earth)' }}>{(farmer.income||0).toLocaleString()} (local)</td>
                    <td style={{ fontSize:12 }}>{farmer.txns}</td>
                    <td>
                      <div style={{ display:'flex', gap:5, flexWrap:'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => navigate(`/lender/farmer/${farmer.id}`)}>
                          Profile
                        </button>
                        <button
                          onClick={() => openMessages(farmer)}
                          style={{
                            position:'relative',
                            padding:'7px 10px', borderRadius:'var(--r-sm)',
                            background: unread ? '#FFEBEE' : 'var(--parchment)',
                            border:`1px solid ${unread ? 'rgba(198,40,40,0.3)' : 'var(--border)'}`,
                            cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                            fontSize:11, color: unread ? '#C62828' : 'var(--earth)',
                            fontFamily:'inherit', fontWeight:500, transition:'all 0.15s',
                          }}
                          title="Send message"
                        >
                          <MessageSquare size={12} />
                          {unread > 0 && (
                            <span style={{
                              position:'absolute', top:-6, right:-6,
                              background:'#C62828', color:'white',
                              width:16, height:16, borderRadius:'50%',
                              fontSize:9, fontWeight:700,
                              display:'flex', alignItems:'center', justifyContent:'center',
                            }}>{unread}</span>
                          )}
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openLoanModal(farmer)}
                          disabled={farmer.loan}
                          style={{ fontSize:11 }}
                        >
                          {farmer.loan ? 'Active Loan' : 'Disburse'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--earth)', fontSize:14 }}>
              No farmers found matching your search.
            </div>
          )}
        </div>

        {/* How scoring works */}
        <div className="card" style={{ background:'var(--soil)' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'rgba(232,213,180,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:16 }}>
            How ShambaChain Credit Scoring Works
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:16 }}>
            {[
              { label:'Harvest Frequency',  max:'200 pts', desc:'Each harvest logged = 25 pts.' },
              { label:'Sales Consistency',  max:'200 pts', desc:'Each sale recorded = 30 pts.'  },
              { label:'Income Growth',      max:'200 pts', desc:'Calibrated per country currency.' },
              { label:'Record Regularity',  max:'150 pts', desc:'Each on-chain entry = 10 pts.' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'var(--r-md)', padding:'14px 16px' }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--sand,#E8D5B4)', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:11, color:'#4CAF77', fontWeight:600, marginBottom:6 }}>Max: {s.max}</div>
                <div style={{ fontSize:12, color:'rgba(232,213,180,0.5)', lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, fontSize:12, color:'rgba(232,213,180,0.3)', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
            Base: 100 pts · Max: 850 pts · Repayment bonus: +50 pts
          </div>
        </div>

      </div>
    </div>
  )
}
