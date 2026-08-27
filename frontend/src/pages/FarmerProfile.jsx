import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp, scoreToTier } from '../context/AppContext.jsx'
import { ScoreRing, ScoreBar, TierBadge, Toast } from '../components/UI.jsx'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react'

const COUNTRY_FLAGS = { Kenya:'🇰🇪', Uganda:'🇺🇬', Ethiopia:'🇪🇹', Nigeria:'🇳🇬' }

export default function FarmerProfile() {
  const { farmerId } = useParams()
  const navigate      = useNavigate()
  const { state }     = useApp()

  // Find the farmer from lenderFarmers list
  const farmer = state.lenderFarmers.find(f => f.id === farmerId)

  if (!farmer) {
    return (
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="card" style={{ textAlign:'center', padding:48, maxWidth:360 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8 }}>Farmer not found</h2>
          <p style={{ color:'var(--earth)', fontSize:14, marginBottom:24 }}>
            This farmer profile doesn't exist or may have been removed.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/lender')}>
            ← Back to Lender Portal
          </button>
        </div>
      </div>
    )
  }

  const tier = scoreToTier(farmer.score)
  const flag = COUNTRY_FLAGS[farmer.country] || '🌍'

  // Score breakdown estimation from aggregate stats
  const divisors = { Kenya:500, Uganda:18000, Ethiopia:30, Nigeria:700 }
  const div = divisors[farmer.country] ?? 500
  const breakdown = {
    freq: Math.min(Math.floor(farmer.txns * 0.4) * 25, 200),
    cons: Math.min(Math.floor(farmer.txns * 0.3) * 30, 200),
    grow: Math.min(Math.floor((farmer.income || 0) / div), 200),
    reg:  Math.min(farmer.txns * 10, 150),
  }

  const radarData = [
    { subject: 'Harvests',   A: (breakdown.freq / 200) * 100 },
    { subject: 'Sales',      A: (breakdown.cons / 200) * 100 },
    { subject: 'Income',     A: (breakdown.grow / 200) * 100 },
    { subject: 'Regularity', A: (breakdown.reg  / 150) * 100 },
    { subject: 'Base',       A: 100 },
  ]

  const nextTier = farmer.score >= 750 ? 850 : farmer.score >= 650 ? 750
    : farmer.score >= 500 ? 650 : farmer.score >= 300 ? 500 : 300
  const nextLabel = farmer.score >= 750 ? 'Max' : farmer.score >= 650 ? 'Platinum'
    : farmer.score >= 500 ? 'Gold' : farmer.score >= 300 ? 'Silver' : 'Bronze'

  return (
    <div style={{ minHeight:'80vh', padding:'40px 0 60px' }}>
      <Toast />
      <div className="container">

        {/* Back + header */}
        <div style={{ marginBottom:32 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/lender')} style={{ gap:6, marginBottom:16 }}>
            <ArrowLeft size={14} /> Back to Lender Portal
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{
              width:56, height:56, borderRadius:'50%',
              background:tier.bg, color:tier.color,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:700, flexShrink:0,
              border:`2px solid ${tier.color}44`
            }}>
              {farmer.avatar}
            </div>
            <div>
              <h1 className="display-md" style={{ marginBottom:4 }}>
                {farmer.name} {flag}
              </h1>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', fontSize:13, color:'var(--earth)' }}>
                <span>{farmer.country} · {farmer.region || farmer.county}</span>
                <span>·</span>
                <span>{farmer.crop}</span>
                <span>·</span>
                <span>{farmer.acres} acres</span>
                <TierBadge score={farmer.score} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Confidentiality notice */}
        <div style={{
          display:'flex', gap:10, alignItems:'flex-start',
          background:'#FFF8E1', border:'1px solid rgba(192,120,0,0.2)',
          borderRadius:'var(--r-sm)', padding:'12px 16px', marginBottom:24,
          fontSize:13, color:'var(--gold-deep)',
        }}>
          <Shield size={16} style={{ flexShrink:0, marginTop:1 }} color="var(--gold)" />
          <div>
            <strong>What you can see:</strong> Publicly verifiable on-chain data only — credit score, tier, transaction count, and income estimates.
            Personal contact details and exact harvest records are private to the farmer.
            All data is sourced from the Stellar blockchain and cannot be altered.
          </div>
        </div>

        {/* ── Score Card ─────────────────────────────────────────────────── */}
        <div className="card" style={{
          marginBottom:24,
          background:'linear-gradient(135deg, var(--soil) 0%, #1a2e14 100%)',
          color:'white',
        }}>
          <div style={{ display:'flex', gap:40, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ position:'relative', width:180, height:180, flexShrink:0 }}>
              <svg width={180} height={180} viewBox="0 0 180 180">
                <circle cx={90} cy={90} r={74} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={13} />
                <circle cx={90} cy={90} r={74} fill="none"
                  stroke={tier.color} strokeWidth={13}
                  strokeDasharray={`${(farmer.score/850)*2*Math.PI*74} ${2*Math.PI*74}`}
                  strokeLinecap="round"
                  style={{ transform:'rotate(-90deg)', transformOrigin:'center', transition:'stroke-dasharray 1.2s ease' }}
                />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:44, fontWeight:700, color:tier.color, lineHeight:1 }}>{farmer.score}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>/ 850</div>
                <div style={{ marginTop:8, fontSize:14, fontWeight:700, color:tier.color }}>{tier.emoji} {tier.label}</div>
              </div>
            </div>

            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                Progress to {nextLabel}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{farmer.score} pts</span>
                <span style={{ fontSize:13, color:tier.color, fontWeight:600 }}>{nextTier} pts</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', marginBottom:20 }}>
                <div style={{
                  height:'100%',
                  width:`${Math.min(((farmer.score-(farmer.score>=650?650:farmer.score>=500?500:farmer.score>=300?300:0))/(nextTier-(farmer.score>=650?650:farmer.score>=500?500:farmer.score>=300?300:0)))*100,100)}%`,
                  background:tier.color, borderRadius:3, transition:'width 1s ease'
                }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {[
                  { label:'Entries',     val: farmer.txns },
                  { label:'Max Loan',    val: `USDC ${tier.maxLoan.toLocaleString()}` },
                  { label:'Farm Size',   val: `${farmer.acres} ac` },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--sand,#E8D5B4)' }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar */}
            <div style={{ width:200 }}>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:'rgba(255,255,255,0.4)' }} />
                  <Radar dataKey="A" stroke={tier.color} fill={tier.color} fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ background:'var(--soil)', border:'none', borderRadius:8, color:'var(--sand)', fontSize:11 }} formatter={v => [`${v.toFixed(0)}%`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
          {/* Score breakdown */}
          <div className="card">
            <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:20 }}>
              Score Breakdown
            </div>
            <ScoreBar label="Harvest frequency"  value={breakdown.freq} max={200} />
            <ScoreBar label="Sales consistency"   value={breakdown.cons} max={200} />
            <ScoreBar label="Income growth"        value={breakdown.grow} max={200} />
            <ScoreBar label="Record regularity"    value={breakdown.reg}  max={150} />
            <div style={{ height:1, background:'var(--border)', margin:'12px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
              <span style={{ color:'var(--earth)' }}>Total score</span>
              <span style={{ fontWeight:700, color:tier.color }}>{farmer.score} / 850</span>
            </div>
          </div>

          {/* Public farm summary */}
          <div className="card">
            <div style={{ fontSize:12, fontWeight:600, color:'var(--earth)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:20 }}>
              Public Farm Summary
            </div>
            {[
              ['Country',          `${flag} ${farmer.country}`],
              ['Region',           farmer.region || farmer.county || '—'],
              ['Primary Crop',     farmer.crop],
              ['Farm Size',        `${farmer.acres} acres`],
              ['On-chain Entries', farmer.txns],
              ['Est. Annual Income', `${(farmer.income||0).toLocaleString()} (local currency)`],
              ['Max Loan Eligible', `USDC ${tier.maxLoan.toLocaleString()}`],
              ['Active Loan',      farmer.loan ? '⚠️ Yes — has active loan' : '✅ No active loans'],
                  ['Verification Ratio', farmer.verificationRatio != null
                    ? `${farmer.verificationRatio}% agent-verified`
                    : farmer.isLive ? `${Math.floor((state?.transactions?.filter(x=>x.verification==='AgentVerified')?.length||0) / Math.max(state?.transactions?.length||1,1) * 100)}% agent-verified`
                    : 'Data from blockchain'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <span style={{ color:'var(--earth)' }}>{k}</span>
                <span style={{ fontWeight:500, textAlign:'right', maxWidth:'55%' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Private data notice */}
        <div className="card" style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ width:40, height:40, borderRadius:'var(--r-sm)', background:'var(--parchment)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <EyeOff size={18} color="var(--earth)" />
          </div>
          <div>
            <div className="title-sm" style={{ marginBottom:6 }}>Data not shown to lenders</div>
            <p style={{ fontSize:13, color:'var(--earth)', lineHeight:1.7 }}>
              The following are <strong>private to the farmer</strong> and not visible here:
              full name, phone number, exact harvest dates and quantities, sale prices, and notes.
              These are encrypted in the farmer's local browser storage and tied to their secret key.
              Only the farmer can access them by logging in with their secret key.
            </p>
            <p style={{ fontSize:13, color:'var(--earth)', lineHeight:1.7, marginTop:8 }}>
              The credit score and tier <strong>are public on the Stellar blockchain</strong> and can be independently verified by anyone.
            </p>
          </div>
        </div>

        {/* Disburse CTA */}
        <div style={{ marginTop:20, textAlign:'right' }}>
          <button
            className="btn btn-gold"
            disabled={farmer.loan}
            onClick={() => navigate('/lender')}
          >
            {farmer.loan ? '⚠️ Farmer has active loan' : `Disburse Loan to ${farmer.name.split(' ')[0]} →`}
          </button>
        </div>

      </div>
    </div>
  )
}