import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Toast } from '../components/UI.jsx'
import {
  Sprout, ShieldCheck, TrendingUp, Smartphone,
  ArrowRight, ChevronRight, Globe, Lock, Zap
} from 'lucide-react'

const STATS = [
  { num: '60M+',   label: 'Smallholder farmers across Africa' },
  { num: '80%',    label: 'Lack formal credit access'         },
  { num: '$0.001', label: 'Cost per Stellar transaction'      },
  { num: '5 sec',  label: 'Stellar settlement time'           },
]

const COUNTRIES = [
  { flag: '🇰🇪', name: 'Kenya',    farmers: '7.4M', crop: 'Maize, Tea, Coffee'       },
  { flag: '🇺🇬', name: 'Uganda',   farmers: '6.8M', crop: 'Beans, Maize, Banana'     },
  { flag: '🇹🇿', name: 'Tanzania', farmers: '17M',  crop: 'Coffee, Cashew, Maize'    },
  { flag: '🇪🇹', name: 'Ethiopia', farmers: '15M',  crop: 'Coffee, Teff, Sorghum'    },
  { flag: '🇳🇬', name: 'Nigeria',  farmers: '36M',  crop: 'Cassava, Yam, Cocoa'      },
]

const FEATURES = [
  { icon: Lock,        title: 'Own your financial history',      desc: 'Every harvest and sale is written to the Stellar blockchain, tamper-proof, permanent, owned by you. No bank can take it away.',                                    color: '#D6F0E0' },
  { icon: TrendingUp,  title: 'Build a verifiable credit score', desc: 'Your on-chain activity automatically generates a credit score (0–850) that lenders and crop insurers can verify in seconds.',                                         color: '#FFF3CD' },
  { icon: Zap,         title: 'Receive USDC loans instantly',    desc: 'Approved lenders disburse loans in USDC directly to your Stellar wallet. No paperwork, no queues, no middlemen.',                                                      color: '#BBDEFB' },
  { icon: Smartphone,  title: 'Works on any phone',              desc: 'Designed for low-bandwidth environments across Africa. Simple local-language-friendly interface, QR-shareable credit profile.',                                        color: '#E8D5B4' },
  { icon: Globe,       title: 'Fully decentralised',             desc: 'Powered by Soroban smart contracts on Stellar. No central database, no single point of failure. Works across borders.',                                               color: '#F3E5F5' },
  { icon: ShieldCheck, title: 'Transparent & auditable',         desc: "Lenders can audit every transaction on Stellar's public ledger before making a credit decision, ensuring full trust, zero fraud.",                                            color: '#FFE0B2' },
]

const HOW_IT_WORKS = [
  { num: '01', title: 'Register your farm',  desc: 'Create a Stellar wallet in 60 seconds. No bank account needed.' },
  { num: '02', title: 'Log your harvests',   desc: 'Record every harvest, sale, and expense as a blockchain transaction.' },
  { num: '03', title: 'Build your score',    desc: 'Your credit score rises automatically with each entry you log.' },
  { num: '04', title: 'Access funding',      desc: 'Apply for USDC loans from verified lenders using your on-chain score.' },
]

const TIERS = [
  { tier: 'Unranked', range: '0–299',  emoji: '🌱', color: '#8B6347', bg: '#F2EAD6', loan: 'USDC 50'    },
  { tier: 'Bronze',   range: '300–499',emoji: '🥉', color: '#8B4513', bg: '#FBE8D8', loan: 'USDC 200'   },
  { tier: 'Silver',   range: '500–649',emoji: '🥈', color: '#607D8B', bg: '#ECEFF1', loan: 'USDC 800'   },
  { tier: 'Gold',     range: '650–749',emoji: '🥇', color: '#C07800', bg: '#FFF3CD', loan: 'USDC 2,000' },
  { tier: 'Platinum', range: '750–850',emoji: '💎', color: '#006064', bg: '#E0F7FA', loan: 'USDC 5,000' },
]

export default function Landing() {
  const navigate  = useNavigate()
  const { state } = useApp()

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <Toast />

      {/* ══════════════════════════════════════════════════════════════════
          HERO — full-viewport background image with overlay + centered copy
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>

        {/* Background image */}
        <img
          src="/farmer-hero.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
          }}
        />

        {/* Dark gradient overlay — heavier at top & bottom, lighter in mid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(
              to bottom,
              rgba(7,20,16,0.82) 0%,
              rgba(7,20,16,0.60) 35%,
              rgba(7,20,16,0.65) 60%,
              rgba(7,20,16,0.92) 100%
            )
          `,
        }} />

        {/* Content — centred */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '80px 24px 60px',
          width: '100%',
          maxWidth: 860,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>

          {/* Pill badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(76,175,119,0.18)',
            border: '1px solid rgba(76,175,119,0.35)',
            color: '#6FD9A0',
            padding: '7px 20px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            marginBottom: 36,
          }}>
            <Sprout size={13} />
            BUILT ON STELLAR BLOCKCHAIN · AFRICA
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(42px, 7vw, 80px)',
            fontWeight: 700,
            color: '#F5EDD8',
            lineHeight: 1.07,
            letterSpacing: '-0.025em',
            marginBottom: 28,
          }}>
            Your farm is your{' '}
            <span style={{
              color: '#52D68A',
              fontStyle: 'italic',
              display: 'block',
            }}>
              credit history
            </span>
          </h1>

          {/* Sub-copy — updated for Africa-wide scope */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 19px)',
            color: 'rgba(245,237,216,0.72)',
            lineHeight: 1.75,
            maxWidth: 600,
            marginBottom: 48,
          }}>
            ShambaChain helps Africa's 60+ million smallholder farmers across{' '}
            <strong style={{ color: 'rgba(245,237,216,0.9)', fontWeight: 600 }}>
              Kenya, Uganda, Tanzania, Ethiopia &amp; Nigeria
            </strong>{' '}
            build a tamper-proof financial record on the Stellar blockchain,
            unlocking loans, crop insurance, and microfinance without a bank account.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
            <button
              onClick={() => navigate(state.farmer ? '/dashboard' : '/onboard')}
              style={{
                background: '#1B5E3B',
                border: 'none',
                color: 'white',
                padding: '15px 34px',
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.2s',
                boxShadow: '0 4px 24px rgba(27,94,59,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2D7D52'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(27,94,59,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1B5E3B'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(27,94,59,0.4)' }}
            >
              {state.farmer ? 'Go to Dashboard' : 'Register as Farmer'}
              <ArrowRight size={17} />
            </button>

            <button
              onClick={() => navigate('/lender')}
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.22)',
                color: 'rgba(245,237,216,0.9)',
                padding: '15px 34px',
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            >
              Lender Portal
            </button>
          </div>

          {/* ── Stats — 4 columns, centred ─────────────────────────────── */}
          <div className="hero-stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0 24px',
            width: '100%',
            maxWidth: 680,
            padding: '28px 40px',
            background: 'rgba(0,0,0,0.30)',
            backdropFilter: 'blur(12px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {STATS.map((s, i) => (
              <div key={s.num} style={{
                textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                padding: '0 12px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 2.8vw, 30px)',
                  fontWeight: 700,
                  color: '#F0C040',
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  {s.num}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(245,237,216,0.45)',
                  lineHeight: 1.45,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thin bottom fade into white section */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 80,
          background: 'linear-gradient(to bottom, transparent, #ffffff)',
          zIndex: 3,
        }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MVP COUNTRIES STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff', padding: '72px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E3B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              MVP · 5-Country Launch
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,38px)', color: '#1C1209', marginBottom: 12 }}>
              Starting across 5 African nations
            </h2>
            <p style={{ fontSize: 15, color: '#8B6347', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Built by a cross-border team from Kenya, Uganda, Tanzania, Ethiopia and Nigeria
              with plans to expand to the entire continent.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {COUNTRIES.map(c => (
              <div key={c.name} style={{
                background: 'var(--cream,#FAF5EC)',
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'center',
                border: '1px solid rgba(28,18,9,0.07)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>{c.flag}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1C1209', marginBottom: 6 }}>{c.name}</div>
                <div style={{
                  display: 'inline-block',
                  background: '#D6F0E0',
                  color: '#1B5E3B',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 999,
                  marginBottom: 10,
                }}>
                  {c.farmers} farmers
                </div>
                <div style={{ fontSize: 12, color: '#8B6347', lineHeight: 1.5 }}>{c.crop}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8B6347', background: '#FAF5EC', border: '1px solid #E0D5C8', borderRadius: 999, padding: '8px 20px' }}>
              <Globe size={14} color="#1B5E3B" />
              Expanding to all 54 African nations in future releases
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--cream,#FAF5EC)', padding: '88px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E3B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,38px)', color: '#1C1209', marginBottom: 14 }}>
              From field to funding in 4 steps
            </h2>
            <p style={{ fontSize: 15, color: '#8B6347', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              ShambaChain turns your farming activity into a verified financial passport on the blockchain.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{ padding: '32px 28px', borderRight: i < 3 ? '1px dashed #D5C9B8' : 'none' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 60, fontWeight: 700, color: 'rgba(27,94,59,0.07)', lineHeight: 1, marginBottom: 18 }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#1C1209' }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: '#8B6347', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff', padding: '88px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E3B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Features</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,38px)', color: '#1C1209' }}>
              Everything a farmer needs
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '28px 24px',
                border: '1px solid rgba(28,18,9,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={22} color="#1B5E3B" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1209' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#8B6347', lineHeight: 1.75, flex: 1 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CREDIT TIERS
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--cream,#FAF5EC)', padding: '88px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E3B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Credit system</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,38px)', color: '#1C1209', marginBottom: 10 }}>
              Your score unlocks more funding
            </h2>
            <p style={{ fontSize: 14, color: '#8B6347' }}>Score range: 0–850 · Mirrors the FICO scale</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            {TIERS.map(t => (
              <div key={t.tier} style={{
                background: t.bg,
                borderRadius: 16,
                padding: '28px 16px',
                textAlign: 'center',
                border: `1px solid ${t.color}22`,
                transition: 'transform 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: 34, marginBottom: 10 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: t.color, marginBottom: 4 }}>{t.tier}</div>
                <div style={{ fontSize: 11, color: '#8B6347', marginBottom: 14, fontFamily: 'monospace' }}>{t.range}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.color, background: 'rgba(0,0,0,0.05)', borderRadius: 999, padding: '5px 10px', display: 'inline-block' }}>
                  Max {t.loan}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════
          TRUST SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--cream,#FAF5EC)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 36, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--leaf)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Trust & Security</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,36px)', color: '#1C1209', marginBottom: 16, lineHeight: 1.2 }}>
                How do we know the data is real?
              </h2>
              <p style={{ fontSize: 15, color: '#8B6347', lineHeight: 1.8, marginBottom: 24 }}>
                A question every lender and user asks and we have a complete answer.
                ShambaChain uses blockchain immutability, cryptographic signatures, field agent
                verification, and satellite cross-checking to ensure every farming record is
                trustworthy.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {[
                  'Blockchain records cannot be altered or backdated',
                  'Field agents counter-sign and attest entries',
                  'Satellite crop data cross-validates harvest claims',
                  'Parametric insurance protects lenders from crop failure',
                  'Smart contract escrow guarantees repayments (v1.1)',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#5C3D2A' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--leaf-pale,#D6F0E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--leaf)' }}>✓</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/trust')}
                style={{
                  background: 'var(--leaf,#1B5E3B)', border: 'none', color: 'white',
                  padding: '13px 28px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex',
                  alignItems: 'center', gap: 8, transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2D7D52'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--leaf,#1B5E3B)'}
              >
                🛡️ Read our full Trust & Verification answer
                <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { emoji: '🔗', title: 'Blockchain immutable', desc: 'Records written to Stellar can never be altered' },
                { emoji: '🛡️', title: 'Agent verified',       desc: 'Field agents counter-sign entries for extra trust' },
                { emoji: '🛰️', title: 'Satellite checked',    desc: 'NASA NDVI data cross-validates crop claims' },
                { emoji: '🌧️', title: 'Crop insurance',       desc: 'Parametric payouts protect lenders from drought' },
              ].map(c => (
                <div key={c.title} style={{ background: 'white', borderRadius: 14, padding: '18px 16px', border: '1px solid rgba(28,18,9,0.07)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1209', marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#8B6347', lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #071410 0%, #0D2A1A 50%, #071A1C 100%)',
        padding: '96px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,119,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,44px)', color: '#F5EDD8', marginBottom: 18, lineHeight: 1.15 }}>
            Ready to build your farming credit history?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(232,213,180,0.55)', marginBottom: 40, lineHeight: 1.75 }}>
            Join farmers across Kenya, Uganda, Tanzania, Ethiopia &amp; Nigeria building their financial future on the blockchain.
          </p>
          <button
            onClick={() => navigate(state.farmer ? '/dashboard' : '/onboard')}
            style={{
              background: '#1B5E3B',
              border: 'none',
              color: 'white',
              padding: '16px 40px',
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s',
              boxShadow: '0 4px 24px rgba(27,94,59,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2D7D52'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1B5E3B'; e.currentTarget.style.transform = 'none' }}
          >
            {state.farmer ? 'Go to My Dashboard' : "Get Started — It's Free"}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#1C1209', padding: '32px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sprout size={16} color="#4CAF77" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#E8D5B4' }}>
              Shamba<span style={{ color: '#4CAF77' }}>Chain</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {['🇰🇪','🇺🇬','🇪🇹','🇳🇬'].map(f => (
              <span key={f} style={{ fontSize: 20 }}>{f}</span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(232,213,180,0.25)', margin: 0 }}>
            Stellar Blockchain · Soroban Smart Contracts · Stellar Give Kenya Bootcamp 2026
          </p>
        </div>
      </footer>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .hero-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .countries-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .how-grid        { grid-template-columns: 1fr !important; }
          .tiers-grid      { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 480px) {
          .hero-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .countries-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
