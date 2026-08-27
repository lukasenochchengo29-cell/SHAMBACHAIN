import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useStellar } from '../hooks/useStellar.js'
import { StepLoader, WalletCard, Toast } from '../components/UI.jsx'
import { CheckCircle, ArrowRight, ArrowLeft, User, MapPin, Sprout } from 'lucide-react'

// ── All 4 MVP countries with regions ──────────────────────────────────────
const COUNTRY_DATA = {
  Kenya: {
    phone: '+254',
    currency: 'KES',
    regions: [
      'Nakuru','Uasin Gishu','Meru','Nyeri','Kirinyaga',"Murang'a",
      'Kiambu','Nyandarua','Kisii','Nyamira','Migori','Kisumu',
      'Trans Nzoia','Bungoma','Kakamega','Embu','Laikipia','Other',
    ],
  },
  Uganda: {
    phone: '+256',
    currency: 'UGX',
    regions: [
      'Wakiso','Kampala','Gulu','Mbarara','Jinja','Mbale',
      'Lira','Arua','Soroti','Fort Portal','Kabale','Masaka','Other',
    ],
  },
  Tanzania: {
    phone: '+255',
    currency: 'TZS',
    regions: [
      'Arusha','Dar es Salaam','Dodoma','Mwanza','Kilimanjaro',
      'Morogoro','Mbeya','Tanga','Zanzibar','Shinyanga',
      'Kagera','Mara','Tabora','Ruvuma','Other',
    ],
  },
  Ethiopia: {
    phone: '+251',
    currency: 'ETB',
    regions: [
      'Oromia','Amhara','SNNPR','Tigray','Somali','Afar',
      'Addis Ababa','Dire Dawa','Benishangul-Gumuz','Gambella','Other',
    ],
  },
  Nigeria: {
    phone: '+234',
    currency: 'NGN',
    regions: [
      'Kano','Lagos','Ogun','Enugu','Anambra','Rivers','Delta',
      'Benue','Plateau','Kaduna','Sokoto','Katsina','Oyo','Ondo','Other',
    ],
  },
}

const CROPS_BY_COUNTRY = {
  Kenya:    ['Maize','Tea','Coffee','Wheat','Beans','Potatoes','Tomatoes','Kale (Sukuma Wiki)','Rice','Sorghum','Dairy','Other'],
  Uganda:   ['Maize','Banana (Matoke)','Beans','Coffee','Cassava','Sweet Potato','Rice','Groundnut','Sorghum','Millet','Other'],
  Tanzania: ['Maize','Coffee','Tea','Cashew Nut','Sisal','Rice','Banana','Cassava','Sunflower','Cotton','Other'],
  Ethiopia: ['Coffee','Teff','Maize','Sorghum','Wheat','Barley','Enset','Chickpea','Sesame','Lentils','Other'],
  Nigeria:  ['Cassava','Yam','Maize','Cocoa','Palm Oil','Groundnut','Soybean','Cowpea','Rice','Sorghum','Other'],
}

const YEARS = ['Less than 1 year','1–3 years','3–5 years','5–10 years','More than 10 years']
const ONBOARD_STEPS = ['Generating your Stellar keypair…','Funding wallet via Friendbot…','Saving your profile on-chain…']

export default function Onboarding() {
  const navigate  = useNavigate()
  const { state } = useApp()
  const { loading, step, onboardFarmer } = useStellar()

  const [page, setPage]     = useState(1)
  const [done, setDone]     = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    fname:'', lname:'', phone:'', country:'Kenya', region:'',
    crop:'', acres:'', years:'', crop2:'',
  })

  if (state.farmer && !loading && !done) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card" style={{ maxWidth:400, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🌾</div>
          <h2 className="title-lg" style={{ marginBottom:8 }}>Already registered!</h2>
          <p style={{ color:'var(--earth)', fontSize:14, marginBottom:24 }}>
            Welcome back, {state.farmer.fname}. Your farm profile is active.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  const countryConfig = COUNTRY_DATA[form.country] || COUNTRY_DATA.Kenya
  const crops         = CROPS_BY_COUNTRY[form.country] || CROPS_BY_COUNTRY.Kenya

  function set(field, val) {
    setForm(f => {
      const updated = { ...f, [field]: val }
      // Reset region + crop when country changes
      if (field === 'country') { updated.region = ''; updated.crop = '' }
      return updated
    })
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate1() {
    const e = {}
    if (!form.fname.trim()) e.fname   = 'First name is required'
    if (!form.lname.trim()) e.lname   = 'Last name is required'
    if (!form.phone.trim()) e.phone   = 'Phone number is required'
    if (!form.country)      e.country = 'Please select your country'
    if (!form.region)       e.region  = 'Please select your region'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validate2() {
    const e = {}
    if (!form.crop)                        e.crop  = 'Please select a crop'
    if (!form.acres || Number(form.acres) <= 0) e.acres = 'Enter a valid farm size'
    if (!form.years)                       e.years = 'Please select years farming'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate2()) return
    const result = await onboardFarmer(form)
    if (result.success) setDone(true)
  }

  const inputStyle = field => errors[field] ? { borderColor:'var(--danger)' } : {}

  if (loading) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card container-xs" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ background:'var(--leaf)', padding:'24px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🌱</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:'white' }}>
              Setting up your ShambaChain account
            </div>
          </div>
          <StepLoader steps={ONBOARD_STEPS} currentStep={step} />
        </div>
      </div>
    )
  }

  if (done && state.farmer && state.keypair) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <Toast />
        <div className="animate-scaleIn" style={{ width:'100%', maxWidth:520 }}>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{
              background:'linear-gradient(135deg, var(--leaf) 0%, var(--leaf-deep,#0D3B28) 100%)',
              padding:'36px 32px', textAlign:'center',
            }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:32 }}>
                🌾
              </div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:26, color:'white', marginBottom:6 }}>
                Welcome to ShambaChain!
              </h2>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14 }}>
                {state.farmer.fname} {state.farmer.lname} · {state.farmer.country} · {state.farmer.region}
              </p>
            </div>
            <div style={{ padding:'28px 32px' }}>
              {/* Wallet address */}
              <div className="wallet-card" style={{ marginBottom:16, position:'relative' }}>
                <div style={{ fontSize:11, color:'rgba(232,213,180,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                  🔐 Stellar Testnet Wallet
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, color:'white', marginBottom:8 }}>
                  10,000 <span style={{ fontSize:13, color:'var(--clay,#C49A6C)', fontFamily:'var(--font-body)' }}>XLM</span>
                </div>
                <div style={{ fontFamily:'monospace', fontSize:10, color:'var(--clay,#C49A6C)', background:'rgba(0,0,0,0.2)', borderRadius:6, padding:'6px 10px', wordBreak:'break-all', marginBottom:4 }}>
                  {state.keypair.publicKey}
                </div>
                <div style={{ fontSize:10, color:'rgba(232,213,180,0.35)' }}>Your public wallet address</div>
              </div>

              {/* ⚠️ Secret key — save this! */}
              <div style={{
                background:'#FFF8E1', border:'2px solid rgba(192,120,0,0.4)',
                borderRadius:'var(--r-md)', padding:'14px 16px', marginBottom:16,
              }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#856404', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                  ⚠️ SAVE YOUR SECRET KEY — YOU NEED THIS TO LOG BACK IN
                </div>
                <div style={{ fontFamily:'monospace', fontSize:11, background:'rgba(0,0,0,0.06)', borderRadius:6, padding:'8px 10px', wordBreak:'break-all', color:'#5C3D00', marginBottom:8, userSelect:'all' }}>
                  {state.keypair.secretKey}
                </div>
                <div style={{ fontSize:11, color:'#856404', lineHeight:1.6 }}>
                  Copy this key and store it safely (notes app, paper, password manager).
                  This is the ONLY way to access your account after logging out. 
                  <strong> ShambaChain cannot recover it.</strong>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {[
                  { icon:'✅', text:'Stellar keypair generated & funded' },
                  { icon:'✅', text:'Farmer profile created on-chain' },
                  { icon:'✅', text:'Credit scoring engine activated' },
                  { icon:'🔜', text:'Log your first harvest to start building score' },
                ].map(item => (
                  <div key={item.text} style={{ display:'flex', gap:10, alignItems:'center', fontSize:13, color:'var(--soil-60)' }}>
                    <span style={{ fontSize:15 }}>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => navigate('/dashboard')}>
                Go to my Dashboard <ArrowRight size={16} />
              </button>
              <button className="btn btn-ghost" style={{ width:'100%', marginTop:8, fontSize:13 }} onClick={() => navigate('/log')}>
                Log my first harvest →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'80vh', padding:'48px 24px', display:'flex', alignItems:'flex-start', justifyContent:'center' }}>
      <Toast />
      <div style={{ width:'100%', maxWidth:560 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--leaf-ghost)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:26 }}>
            🌱
          </div>
          <h1 className="display-md" style={{ marginBottom:6 }}>Create your farm profile</h1>
          <p style={{ color:'var(--earth)', fontSize:14 }}>Takes 2 minutes. We'll create a Stellar wallet automatically.</p>
        </div>

        {/* Stepper */}
        <div className="stepper" style={{ marginBottom:32, justifyContent:'center' }}>
          {[
            { n:1, label:'Your details' },
            { n:2, label:'Farm info'    },
            { n:3, label:'Wallet'       },
          ].map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div className="step-item">
                <div className={`step-circle ${page > n ? 'done' : page === n ? 'active' : 'pending'}`}>
                  {page > n ? '✓' : n}
                </div>
                <span className={`step-label ${page > n ? 'done' : page === n ? 'active' : 'pending'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`step-connector ${page > n ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1 ───────────────────────────────────────────────────── */}
        {page === 1 && (
          <div className="card animate-fadeIn">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ width:36, height:36, borderRadius:'var(--r-sm)', background:'var(--leaf-ghost)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <User size={16} color="var(--leaf)" />
              </div>
              <div>
                <div className="title-sm">Personal details</div>
                <div style={{ fontSize:12, color:'var(--earth)' }}>Step 1 of 2</div>
              </div>
            </div>

            <div className="input-grid-2">
              <div className="form-group">
                <label className="form-label">First name *</label>
                <input className="form-input" style={inputStyle('fname')} placeholder="e.g. Amina" value={form.fname} onChange={e => set('fname', e.target.value)} />
                {errors.fname && <span className="form-error">{errors.fname}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last name *</label>
                <input className="form-input" style={inputStyle('lname')} placeholder="e.g. Nakato" value={form.lname} onChange={e => set('lname', e.target.value)} />
                {errors.lname && <span className="form-error">{errors.lname}</span>}
              </div>
            </div>

            {/* Country selector */}
            <div className="form-group" style={{ marginTop:16 }}>
              <label className="form-label">Country *</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
                {[
                  { code:'Kenya',    flag:'🇰🇪', abbr:'KE' },
                  { code:'Uganda',   flag:'🇺🇬', abbr:'UG' },
                  { code:'Tanzania', flag:'🇹🇿', abbr:'TZ' },
                  { code:'Ethiopia', flag:'🇪🇹', abbr:'ET' },
                  { code:'Nigeria',  flag:'🇳🇬', abbr:'NG' },
                ].map(c => (
                  <button key={c.code} type="button" onClick={() => set('country', c.code)} style={{
                    padding:'8px 4px', borderRadius:'var(--r-md)', textAlign:'center',
                    border:`2px solid ${form.country === c.code ? 'var(--leaf)' : 'var(--border)'}`,
                    background: form.country === c.code ? 'var(--leaf-ghost)' : 'var(--white)',
                    cursor:'pointer', transition:'all 0.15s',
                  }}>
                    <div style={{ fontSize:20, marginBottom:2, lineHeight:1 }}>{c.flag}</div>
                    <div style={{ fontSize:9, fontWeight:600, color: form.country === c.code ? 'var(--leaf)' : 'var(--earth)', marginTop:2 }}>{c.abbr || c.code.slice(0,2).toUpperCase()}</div>
                    <div style={{ fontSize:8, color:'var(--earth)', opacity:0.7 }}>{c.code}</div>
                  </button>
                ))}
              </div>
              {errors.country && <span className="form-error">{errors.country}</span>}
            </div>

            <div className="input-grid-2" style={{ marginTop:16 }}>
              <div className="form-group">
                <label className="form-label">Phone number *</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--earth)', pointerEvents:'none' }}>
                    {countryConfig.phone}
                  </span>
                  <input
                    className="form-input" style={{ ...inputStyle('phone'), paddingLeft: countryConfig.phone.length > 3 ? 52 : 44 }}
                    placeholder="7XX XXX XXX"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Region / County *</label>
                <select className="form-input" style={inputStyle('region')} value={form.region} onChange={e => set('region', e.target.value)}>
                  <option value="">Select region</option>
                  {countryConfig.regions.map(r => <option key={r}>{r}</option>)}
                </select>
                {errors.region && <span className="form-error">{errors.region}</span>}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width:'100%', marginTop:24 }} onClick={() => validate1() && setPage(2)}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2 ───────────────────────────────────────────────────── */}
        {page === 2 && (
          <div className="card animate-fadeIn">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ width:36, height:36, borderRadius:'var(--r-sm)', background:'var(--leaf-ghost)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <MapPin size={16} color="var(--leaf)" />
              </div>
              <div>
                <div className="title-sm">Farm information</div>
                <div style={{ fontSize:12, color:'var(--earth)' }}>Step 2 of 2 · {form.country} {form.country === 'Kenya' ? '🇰🇪' : form.country === 'Uganda' ? '🇺🇬' : form.country === 'Ethiopia' ? '🇪🇹' : '🇳🇬'}</div>
              </div>
            </div>

            <div className="input-grid-2">
              <div className="form-group">
                <label className="form-label">Primary crop *</label>
                <select className="form-input" style={inputStyle('crop')} value={form.crop} onChange={e => set('crop', e.target.value)}>
                  <option value="">Select crop</option>
                  {crops.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.crop && <span className="form-error">{errors.crop}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Farm size (acres) *</label>
                <input className="form-input" style={inputStyle('acres')} type="number" placeholder="e.g. 2.5" min="0.1" step="0.1" value={form.acres} onChange={e => set('acres', e.target.value)} />
                {errors.acres && <span className="form-error">{errors.acres}</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginTop:16 }}>
              <label className="form-label">Years farming this land *</label>
              <select className="form-input" style={inputStyle('years')} value={form.years} onChange={e => set('years', e.target.value)}>
                <option value="">Select range</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
              {errors.years && <span className="form-error">{errors.years}</span>}
            </div>

            <div className="form-group" style={{ marginTop:16 }}>
              <label className="form-label">Secondary crops <span style={{ color:'var(--earth)', fontWeight:400 }}>(optional)</span></label>
              <input className="form-input" placeholder={`e.g. ${crops[1] || 'Beans'}, ${crops[2] || 'Tomatoes'}`} value={form.crop2} onChange={e => set('crop2', e.target.value)} />
            </div>

            <div style={{ marginTop:12, padding:'12px 16px', background:'var(--leaf-ghost)', borderRadius:'var(--r-sm)', fontSize:13, color:'var(--leaf)', lineHeight:1.6 }}>
              🔒 A Stellar wallet will be created automatically. Your private key is stored only in your browser. Currency tracked: <strong>{countryConfig.currency}</strong>.
            </div>

            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button className="btn btn-ghost" onClick={() => setPage(1)} style={{ gap:8 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSubmit}>
                Create my wallet & register <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}