import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, scoreToTier } from '../context/AppContext.jsx'
import { useScore } from '../hooks/useScore.js'
import { useStellar } from '../hooks/useStellar.js'
import { ScoreRing, TierBadge, StepLoader, Toast } from '../components/UI.jsx'
import { ArrowLeft, CheckCircle, Clock, XCircle, DollarSign, Calendar, FileText } from 'lucide-react'
import { fmtUsdc } from '../utils/stellarUtils.js'

const PURPOSES = [
  'Buy certified seeds',
  'Buy fertiliser / agrochemicals',
  'Pay farm labour',
  'Buy irrigation equipment',
  'Buy farm machinery',
  'Pay school fees',
  'Post-harvest handling',
  'Other farm expense',
]

const PERIODS = [
  { val: '3',  label: '3 months',  rate: '5%'  },
  { val: '6',  label: '6 months',  rate: '9%'  },
  { val: '12', label: '12 months', rate: '16%' },
]

const LOAN_STEPS = [
  'Verifying credit score on-chain…',
  'Submitting application to Stellar…',
  'Recording loan reference on ledger…',
]

function StatusBadge({ status }) {
  const map = {
    Pending:   { cls: 'badge-gold',    icon: Clock,        label: 'Pending Review' },
    Disbursed: { cls: 'badge-green',   icon: CheckCircle,  label: 'Disbursed'      },
    Repaid:    { cls: 'badge-blue',    icon: CheckCircle,  label: 'Fully Repaid'   },
    Rejected:  { cls: 'badge-danger',  icon: XCircle,      label: 'Rejected'       },
  }
  const s = map[status] || map.Pending
  return (
    <span className={`badge ${s.cls}`} style={{ fontSize: 12 }}>
      <s.icon size={12} /> {s.label}
    </span>
  )
}

export default function LoanRequest() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { score, tier } = useScore()
  const { loading, step, applyLoan } = useStellar()

  const [tab, setTab]       = useState('apply')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm]     = useState({ amount: '', period: '6', purpose: '', lender: 'GBMQXHSLXA33A47OA3QYQNRRY2DZC2ZTYCFNSMQCWY3MVLB237YLLY47' })

  if (!state.farmer) { navigate('/onboard'); return null }

  const maxLoan  = tier.maxLoan
  const eligible = score >= 200

  function set(f, v) {
    setForm(p => ({ ...p, [f]: v }))
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }))
  }

  function validate() {
    const e = {}
    const amt = Number(form.amount)
    if (!form.amount || amt <= 0)    e.amount  = 'Enter a valid loan amount'
    if (amt > maxLoan)               e.amount  = `Maximum loan for your tier is USDC ${maxLoan.toLocaleString()}`
    if (amt < 10)                    e.amount  = 'Minimum loan amount is USDC 10'
    if (!form.purpose)               e.purpose = 'Please select a purpose'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleApply() {
    if (!eligible)     return
    if (!validate())   return
    const res = await applyLoan({ ...form })
    if (res.success) setSubmitted(true)
  }

  // Simulate lender approval (demo)
  async function simulateApprove(loanId) {
    dispatch({ type: 'UPDATE_LOAN', payload: { id: loanId, status: 'Disbursed', approvedAt: new Date().toISOString() } })
  }
  async function simulateRepay(loan) {
    dispatch({ type: 'UPDATE_LOAN', payload: { ...loan, repaidAmount: loan.amountUsdc, status: 'Repaid' } })
  }

  const activeLoans = state.loans
  const selectedPeriod = PERIODS.find(p => p.val === form.period) || PERIODS[1]
  const monthlyEst = form.amount ? Math.ceil((Number(form.amount) / Number(form.period)) * 1.02) : 0

  return (
    <div style={{ minHeight: '80vh', padding: '40px 0 60px' }}>
      <Toast />
      <div className="container-sm">

        <div style={{ marginBottom: 32 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="display-md" style={{ marginBottom: 4 }}>Farm Loan</h1>
          <p style={{ color: 'var(--earth)', fontSize: 14 }}>Apply for a USDC loan backed by your on-chain credit score</p>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 24 }}>
          <button className={`tab-btn ${tab === 'apply' ? 'active' : ''}`} onClick={() => setTab('apply')}>Apply for Loan</button>
          <button className={`tab-btn ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>
            My Loans {activeLoans.length > 0 && `(${activeLoans.length})`}
          </button>
        </div>

        {/* ── APPLY TAB ──────────────────────────────────────────────────── */}
        {tab === 'apply' && (
          <>
            {loading ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--leaf) 0%, var(--sky,#1565C0) 100%)', padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>💸</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'white' }}>Processing Loan Application</div>
                </div>
                <StepLoader steps={LOAN_STEPS} currentStep={step} />
              </div>
            ) : submitted ? (
              <div className="card animate-scaleIn" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>💸</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>Application Submitted!</h2>
                <p style={{ color: 'var(--earth)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  Your loan application for <strong>USDC {form.amount}</strong> has been recorded on Stellar and submitted to the lender for review.
                </p>
                <div style={{ background: 'var(--gold-pale)', borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--gold-deep)', fontWeight: 600, marginBottom: 10 }}>Application summary</div>
                  {[
                    ['Amount', `USDC ${form.amount}`],
                    ['Repayment period', `${form.period} months`],
                    ['Purpose', form.purpose],
                    ['Your credit score', `${score} (${tier.emoji} ${tier.label})`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ color: 'var(--earth)' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setTab('status'); setSubmitted(false) }}>
                    Track Application
                  </button>
                  <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Dashboard</button>
                </div>
              </div>
            ) : (
              <>
                {/* Eligibility card */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                    Your Eligibility
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <ScoreRing score={score} size={120} strokeWidth={10} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <TierBadge score={score} />
                        {eligible
                          ? <span className="badge badge-green"><CheckCircle size={11} /> Eligible for loan</span>
                          : <span className="badge badge-danger"><XCircle size={11} /> Score too low</span>
                        }
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--earth)', lineHeight: 1.7 }}>
                        {eligible
                          ? <>You qualify for up to <strong style={{ color: 'var(--soil)' }}>USDC {maxLoan.toLocaleString()}</strong> based on your {tier.label} tier. Log more entries to increase your limit.</>
                          : <>Your score of <strong>{score}</strong> is below the minimum of <strong>200</strong> required. Log harvests and sales to build your score.</>
                        }
                      </div>
                      {!eligible && (
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/log')}>
                          Log Entry to Build Score →
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {eligible && (
                  <div className="card">
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
                      Loan Details
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Loan amount (USDC) *</label>
                      <input
                        className={`form-input ${errors.amount ? 'error' : ''}`}
                        type="number" placeholder={`Max: USDC ${maxLoan}`}
                        min={10} max={maxLoan} value={form.amount}
                        onChange={e => set('amount', e.target.value)}
                      />
                      {errors.amount && <span className="form-error">{errors.amount}</span>}
                      {form.amount && !errors.amount && (
                        <span className="form-hint">Estimated monthly repayment: USDC {monthlyEst} (incl. {selectedPeriod.rate} interest)</span>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Repayment period *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {PERIODS.map(p => (
                          <button key={p.val} onClick={() => set('period', p.val)} style={{
                            padding: '12px', borderRadius: 'var(--r-md)', textAlign: 'center',
                            border: `2px solid ${form.period === p.val ? 'var(--leaf)' : 'var(--border)'}`,
                            background: form.period === p.val ? 'var(--leaf-ghost)' : 'var(--white)',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: form.period === p.val ? 'var(--leaf)' : 'var(--soil)' }}>{p.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--earth)' }}>{p.rate} interest</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Loan purpose *</label>
                      <select className={`form-input ${errors.purpose ? 'error' : ''}`} value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                        <option value="">Select purpose</option>
                        {PURPOSES.map(p => <option key={p}>{p}</option>)}
                      </select>
                      {errors.purpose && <span className="form-error">{errors.purpose}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Lender wallet address</label>
                      <input className="form-input" placeholder="G…" value={form.lender} onChange={e => set('lender', e.target.value)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                      <span className="form-hint">Default: ShambaChain Demo Lender</span>
                    </div>

                    <div style={{ background: 'var(--leaf-ghost)', borderRadius: 'var(--r-sm)', padding: '12px 16px', fontSize: 13, color: 'var(--leaf)', lineHeight: 1.6, marginBottom: 20 }}>
                      💸 <strong>Where does the loan go?</strong> Once approved, the lender sends USDC directly to your unique Stellar wallet address (<span style={{fontFamily:'monospace',fontSize:11}}>{state.keypair?.publicKey?.slice(0,12)}…</span>). You will see it in your dashboard instantly. Your credit score of <strong>{score}</strong> determines your loan limit.
                    </div>

                    <button className="btn btn-gold" style={{ width: '100%', fontSize: 15 }} onClick={handleApply} disabled={loading}>
                      {loading ? <><span className="spinner" /> Processing…</> : `Submit Loan Application →`}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── STATUS TAB ──────────────────────────────────────────────────── */}
        {tab === 'status' && (
          <>
            {activeLoans.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <h3 className="title-md" style={{ marginBottom: 8 }}>No loan applications yet</h3>
                <p style={{ color: 'var(--earth)', fontSize: 14, marginBottom: 24 }}>Apply for your first loan to see it here.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('apply')}>Apply for Loan →</button>
              </div>
            ) : (
              activeLoans.map(loan => {
                const repayPct = loan.amountUsdc > 0 ? Math.min((loan.repaidAmount / loan.amountUsdc) * 100, 100) : 0
                return (
                  <div key={loan.id} className="card" style={{ marginBottom: 16 }}>
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                      <div>
                        <div className="title-sm" style={{ marginBottom: 4 }}>USDC {loan.amountUsdc?.toLocaleString()} loan</div>
                        <div style={{ fontSize: 12, color: 'var(--earth)' }}>Ref: {loan.id}</div>
                      </div>
                      <StatusBadge status={loan.status} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: 'Purpose',    val: loan.purpose,         icon: FileText   },
                        { label: 'Period',     val: `${loan.periodMonths} months`, icon: Calendar },
                        { label: 'Applied',    val: new Date(loan.appliedAt).toLocaleDateString('en-KE'), icon: Clock },
                        { label: 'Approved',   val: loan.approvedAt ? new Date(loan.approvedAt).toLocaleDateString('en-KE') : '—', icon: CheckCircle },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--parchment)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: 'var(--earth)', marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.val}</div>
                        </div>
                      ))}
                    </div>

                    {loan.status === 'Disbursed' && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: 'var(--earth)' }}>Repayment progress</span>
                          <span style={{ fontWeight: 600 }}>USDC {loan.repaidAmount || 0} / {loan.amountUsdc}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill progress-fill-gold" style={{ width: `${repayPct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Demo action buttons */}
                    {loan.status === 'Pending' && (
                      <div className="alert alert-gold" style={{ marginBottom: 12 }}>
                        <Clock size={14} />
                        <span>Awaiting lender review. Demo: <button onClick={() => simulateApprove(loan.id)} style={{ background:'none', border:'none', color:'inherit', fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>Simulate approval</button></span>
                      </div>
                    )}
                    {loan.status === 'Disbursed' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div className="alert alert-green" style={{ flex: 1, marginBottom: 0 }}>
                          <CheckCircle size={14} /> Loan disbursed to your Stellar wallet!
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => simulateRepay(loan)}>
                          Simulate Repayment
                        </button>
                      </div>
                    )}
                    {loan.status === 'Repaid' && (
                      <div className="alert alert-green">
                        <CheckCircle size={14} /> Loan fully repaid! Your credit score received a +50 bonus.
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
