import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useScore } from '../hooks/useScore.js'
import { useStellar } from '../hooks/useStellar.js'
import { StepLoader, Toast } from '../components/UI.jsx'
import { CheckCircle, ArrowLeft, Sprout, DollarSign, Receipt } from 'lucide-react'

const CROPS = ['Maize','Tea','Coffee','Wheat','Beans','Potatoes','Tomatoes','Kale (Sukuma Wiki)','Rice','Sorghum','Dairy','Horticulture','Other']

const LOG_STEPS = ['Building Stellar transaction…', 'Signing with keypair…', 'Submitting to testnet…']

const ENTRY_TYPES = [
  { id:'harvest', label:'Harvest', icon: Sprout,      color:'var(--leaf)',  bg:'var(--leaf-ghost)',  desc:'Record crops you harvested from your field' },
  { id:'sale',    label:'Sale',    icon: DollarSign,  color:'var(--gold)',  bg:'var(--gold-pale)',   desc:'Record crops you sold and income received'  },
  { id:'expense', label:'Expense', icon: Receipt,     color:'var(--earth)', bg:'var(--parchment)',   desc:'Record farm costs like seeds or labour'     },
]

export default function LogEntry() {
  const navigate    = useNavigate()
  const { state }   = useApp()
  const { loading, step, logEntry } = useStellar()
  const { currency } = useScore()
  const curr = currency?.symbol || 'LOCAL'

  const [entryType, setEntryType] = useState('harvest')
  const [result,    setResult]    = useState(null)
  const [errors,    setErrors]    = useState({})
  const [form, setForm] = useState({
    crop: 'Maize', qty: '', value: '', date: new Date().toISOString().split('T')[0], notes: '',
  })

  if (!state.farmer) {
    navigate('/onboard')
    return null
  }

  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.value || Number(form.value) <= 0) e.value = 'Please enter a valid amount'
    if (!form.date)  e.date  = 'Date is required'
    if (entryType !== 'expense' && (!form.qty || Number(form.qty) <= 0)) e.qty = 'Please enter quantity'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const res = await logEntry({ entryType, ...form })
    if (res.success) setResult(res)
  }

  function reset() {
    setResult(null)
    setForm({ crop:'Maize', qty:'', value:'', date:new Date().toISOString().split('T')[0], notes:'' })
    setEntryType('harvest')
    setErrors({})
  }

  const activeType = ENTRY_TYPES.find(t => t.id === entryType)

  if (loading) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card" style={{ maxWidth:420, width:'100%', padding:0, overflow:'hidden' }}>
          <div style={{ background:`linear-gradient(135deg, ${activeType.color} 0%, var(--soil) 100%)`, padding:'24px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:6 }}>⛓️</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'white' }}>
              Recording on Stellar Blockchain
            </div>
          </div>
          <StepLoader steps={LOG_STEPS} currentStep={step} />
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <Toast />
        <div className="card animate-scaleIn" style={{ maxWidth:460, width:'100%', textAlign:'center', padding:40 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--leaf-ghost)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>
            ✅
          </div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, marginBottom:8 }}>
            Recorded on Blockchain!
          </h2>
          <p style={{ color:'var(--earth)', fontSize:14, marginBottom:20, lineHeight:1.6 }}>
            Your {entryType} of <strong>{form.qty ? `${form.qty} kg ` : ''}{form.crop}</strong> worth{' '}
            <strong>{curr} {Number(form.value).toLocaleString()}</strong> is permanently recorded on Stellar.
          </p>

          <div style={{ background:'var(--parchment)', borderRadius:'var(--r-md)', padding:'14px 16px', marginBottom:24, textAlign:'left' }}>
            <div style={{ fontSize:11, color:'var(--earth)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Transaction Hash</div>
            <div className="mono" style={{ color:'var(--leaf)', wordBreak:'break-all' }}>{result.hash}</div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
              <CheckCircle size={16} color="var(--leaf)" />
              <span style={{ fontSize:13, color:'var(--leaf)', fontWeight:600 }}>
                Credit score updated automatically
              </span>
            </div>
            <div style={{ background:'#FFF8E1', border:'1px solid rgba(192,120,0,0.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#856404', lineHeight:1.6, textAlign:'left' }}>
              <strong>🟡 Self-reported entry</strong> — This entry carries standard score weight (1.0×).
              A field agent can counter-sign it to upgrade to <strong>Agent Verified (1.4×)</strong> which will boost your score further.
              Satellite data will also be cross-checked automatically for crop plausibility.
            </div>
          </div>

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={reset}>Log another entry</button>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={() => navigate('/dashboard')}>Dashboard</button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width:'100%', marginTop:8 }} onClick={() => navigate('/credit-score')}>
            View credit score update
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'80vh', padding:'40px 0 60px' }}>
      <Toast />
      <div className="container-sm">

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ gap:6, marginBottom:16 }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="display-md" style={{ marginBottom:4 }}>Log Entry</h1>
          <p style={{ color:'var(--earth)', fontSize:14 }}>
            This will be submitted as a transaction on the Stellar Testnet
          </p>
        </div>

        {/* Entry type selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
          {ENTRY_TYPES.map(t => (
            <button key={t.id} onClick={() => setEntryType(t.id)} style={{
              padding:'16px 12px', borderRadius:'var(--r-md)', textAlign:'center',
              border:`2px solid ${entryType === t.id ? t.color : 'var(--border)'}`,
              background: entryType === t.id ? t.bg : 'var(--white)',
              cursor:'pointer', transition:'all 0.2s',
            }}>
              <t.icon size={20} color={entryType === t.id ? t.color : 'var(--earth)'} style={{ margin:'0 auto 6px' }} />
              <div style={{ fontSize:13, fontWeight:600, color: entryType === t.id ? t.color : 'var(--soil)' }}>{t.label}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card">
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
            <div style={{ width:36, height:36, borderRadius:'var(--r-sm)', background:activeType.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <activeType.icon size={16} color={activeType.color} />
            </div>
            <div>
              <div className="title-sm">
                {entryType === 'harvest' ? 'Record Harvest' : entryType === 'sale' ? 'Record Sale' : 'Record Expense'}
              </div>
              <div style={{ fontSize:12, color:'var(--earth)' }}>{activeType.desc}</div>
            </div>
          </div>

          <div className="input-grid-2">
            <div className="form-group">
              <label className="form-label">Crop / Item</label>
              <select className="form-input" value={form.crop} onChange={e => set('crop', e.target.value)}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
                {entryType === 'expense' && <option>Fertiliser</option>}
                {entryType === 'expense' && <option>Labour</option>}
                {entryType === 'expense' && <option>Equipment</option>}
                {entryType === 'expense' && <option>General</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                {entryType === 'harvest' ? 'Quantity harvested (kg) *' :
                 entryType === 'sale'    ? 'Quantity sold (kg) *'       :
                 'Quantity (optional)'}
              </label>
              <input
                className={`form-input ${errors.qty ? 'error' : ''}`}
                type="number" placeholder="e.g. 500"
                min="0" value={form.qty}
                onChange={e => set('qty', e.target.value)}
              />
              {errors.qty && <span className="form-error">{errors.qty}</span>}
            </div>
          </div>

          <div className="input-grid-2" style={{ marginTop:16 }}>
            <div className="form-group">
              <label className="form-label">
                {entryType === 'expense' ? `Cost (${curr}) *` :
                 entryType === 'sale'    ? `Amount received (${curr}) *` :
                 `Estimated value (${curr}) *`}
              </label>
              <input
                className={`form-input ${errors.value ? 'error' : ''}`}
                type="number" placeholder="e.g. 15000"
                min="0" value={form.value}
                onChange={e => set('value', e.target.value)}
              />
              {errors.value && <span className="form-error">{errors.value}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                className={`form-input ${errors.date ? 'error' : ''}`}
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop:16 }}>
            <label className="form-label">Notes <span style={{ color:'var(--earth)', fontWeight:400 }}>(optional)</span></label>
            <textarea
              className="form-input" rows={3}
              placeholder={
                entryType === 'harvest' ? 'e.g. Good rains this season, high yield from north section' :
                entryType === 'sale'    ? 'e.g. Sold to local market at good price' :
                'e.g. Bought CAN fertiliser 50kg × 2 bags'
              }
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              style={{ resize:'vertical', minHeight:80 }}
            />
          </div>

          {/* On-chain info */}
          <div style={{ marginTop:16, padding:'12px 16px', background:'var(--leaf-ghost)', borderRadius:'var(--r-sm)', fontSize:13, color:'var(--leaf)', display:'flex', gap:8, alignItems:'flex-start' }}>
            <span>⛓️</span>
            <div>
              <strong>This will be recorded on Stellar Testnet</strong>
              <div style={{ fontWeight:400, marginTop:2, opacity:0.8 }}>
                A payment transaction with your entry encoded in the memo field.
                Transaction fee: ~0.00001 XLM
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" /> Submitting…</> : `Record ${entryType} on Blockchain →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
