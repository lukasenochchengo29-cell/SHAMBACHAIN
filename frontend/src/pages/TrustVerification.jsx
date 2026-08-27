import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Users, Camera, MapPin, TrendingUp,
  Landmark, Lock, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, ArrowRight, FileText,
  Star, Zap, Globe, RefreshCw
} from 'lucide-react'
import { Toast } from '../components/UI.jsx'

// ── Accordion component ───────────────────────────────────────────────────
function Accordion({ q, children, accent = 'var(--leaf)' }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          padding: '16px 20px', background: open ? 'var(--leaf-ghost)' : 'white',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          textAlign: 'left', transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--soil)', lineHeight: 1.4 }}>{q}</span>
        {open
          ? <ChevronUp size={16} color={accent} style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="var(--earth)" style={{ flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{
          padding: '0 20px 20px', background: 'white',
          fontSize: 14, color: 'var(--soil-60,#5C3D2A)', lineHeight: 1.8,
          borderTop: `3px solid ${accent}`,
        }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </div>
  )
}

// ── Pillar card ────────────────────────────────────────────────────────────
function Pillar({ icon: Icon, title, color, bg, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--r-lg)', padding: '28px 24px',
      border: '1px solid var(--border)',
      borderTop: `4px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.09)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--soil)' }}>{title}</h3>
      <div style={{ fontSize: 13, color: 'var(--earth)', lineHeight: 1.75, flex: 1 }}>{children}</div>
    </div>
  )
}

// ── Step row ───────────────────────────────────────────────────────────────
function Step({ num, title, desc, color = 'var(--leaf)' }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: color, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>{num}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--soil)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--earth)', lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  )
}

export default function TrustVerification() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--font-body)' }}>
      <Toast />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(150deg, #071410 0%, #0D2218 50%, #071A1C 100%)',
        padding: '72px 48px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,119,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(76,175,119,0.15)', border: '1px solid rgba(76,175,119,0.3)',
            color: '#4CAF77', padding: '6px 18px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 28,
          }}>
            <ShieldCheck size={13} /> TRUST · VERIFICATION · SECURITY
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 58px)',
            color: '#F5EDD8', marginBottom: 20, lineHeight: 1.1, fontWeight: 700,
          }}>
            How ShambaChain ensures<br />
            <span style={{ color: '#52D68A' }}>trust & data integrity</span>
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(245,237,216,0.62)', maxWidth: 600,
            margin: '0 auto 40px', lineHeight: 1.75,
          }}>
            We answer the hard questions every lender, insurer and user needs answered:
            Who records data? How is it verified? How are repayments guaranteed?
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#data-integrity" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ gap: 8 }}>
                Data Integrity <ArrowRight size={16} />
              </button>
            </a>
            <a href="#repayment" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(245,237,216,0.85)', padding: '12px 24px', borderRadius: 999,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Repayment Assurance
              </button>
            </a>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>

        {/* ── SECTION 1: Who records data? ─────────────────────────────── */}
        <section id="data-integrity" style={{ padding: '80px 0 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            {/* <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--leaf)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Question 1</div> */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,38px)', color: 'var(--soil)', marginBottom: 14 }}>
              Who records farming data and how do we know it's real?
            </h2>
            <p style={{ fontSize: 15, color: 'var(--earth)', maxWidth: 600, margin: '0 auto', lineHeight: 1.75 }}>
              ShambaChain uses a <strong>multi-layer verification model</strong>. Farmers record their
              own activity, but multiple independent checks prevent fraud.
            </p>
          </div>

          {/* 3-party model */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 48 }}>
            <Pillar icon={Users} title="1. Farmer (Primary recorder)" color="var(--leaf)" bg="var(--leaf-ghost)">
              The farmer logs harvests, sales and expenses directly through ShambaChain.
              Every entry is signed by their unique Stellar keypair and written permanently
              to the blockchain  <strong>it cannot be altered, backdated or deleted</strong> once submitted.
            </Pillar>
            <Pillar icon={ShieldCheck} title="2. Field Agent (Verifier)" color="var(--gold)" bg="var(--gold-pale)">
              Licensed field agents from <strong>cooperatives, agri-NGOs or microfinance partners </strong>
              periodically and randomly visit and counter-sign entries. Verified entries receive a
              blockchain attestation badge  lenders can see exactly which entries are
              agent-verified vs self-reported.
            </Pillar>
            <Pillar icon={Globe} title="3. Cross-source Validation" color="#1565C0" bg="#BBDEFB">
              ShambaChain cross-checks data with <strong>satellite crop monitoring
              (e.g. NASA NDVI), weather APIs, and national cooperative records</strong>.
              Entries that contradict satellite data during a drought season, for
              example, are automatically flagged for review.
            </Pillar>
          </div>

          {/* Fraud deterrents */}
          <div className="card" style={{ marginBottom: 32, borderLeft: '4px solid var(--leaf)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--leaf-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={18} color="var(--leaf)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>5 layers that prevent false data</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                  {[
                    ['Blockchain immutability', 'Once written to Stellar, no one not even ShambaChain can edit or delete an entry'],
                    ['Keypair signature',        'Each entry is cryptographically signed; only the rightful wallet owner can submit entries'],
                    ['GPS + timestamp',          'Entries are stamped with device GPS coordinates and an exact timestamp at submission'],
                    ['Photo evidence (roadmap)', 'Farmers can optionally attach a harvest photo hash to the blockchain entry (IPFS)'],
                    ['Score consequence',        'Fraudulent entries harm the farmer\'s own credit score, making fraud self-defeating'],
                    ['Agent counter-signing',    'Unverified entries earn less score weight than agent-attested ones'],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
                      <CheckCircle size={14} color="var(--leaf)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div><strong>{title}:</strong> <span style={{ color: 'var(--earth)' }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MVP vs Roadmap note */}
          <div style={{
            background: 'var(--gold-pale)', borderRadius: 'var(--r-md)', padding: '16px 20px',
            border: '1px solid rgba(192,120,0,0.2)', marginBottom: 48,
            display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13,
          }}>
            <AlertTriangle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong style={{ color: 'var(--gold-deep)' }}>MVP scope (what's live now):</strong>{' '}
              <span style={{ color: 'var(--gold-deep)' }}>
                Farmer self-recording with blockchain immutability and keypair signatures.
                GPS stamping and satellite cross-validation are on the roadmap for v1.1.
                Agent counter-signing integration is planned for Q3 2025 through partnerships
                with Kenya Cooperative Creameries (KCC), Uganda Cooperative Alliance, and
                Ethiopia Coffee Farmers Cooperative Union.
              </span>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Payment flows ────────────────────────────────── */}
        <section id="repayment" style={{ paddingTop: 0, paddingBottom: 48 }}>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 64 }} />
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            {/* <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Question 2</div> */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.5vw,38px)', color: 'var(--soil)', marginBottom: 14 }}>
              How do payments reach lenders & insurers?
            </h2>
            <p style={{ fontSize: 15, color: 'var(--earth)', maxWidth: 580, margin: '0 auto', lineHeight: 1.75 }}>
              All payments flow through Stellar's blockchain transparent, instant, and borderless.
            </p>
          </div>

          {/* Loan disbursement flow */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 24 }}>
              💸 Loan disbursement flow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Step num="1" title="Lender reviews ShambaChain credit score on-chain" desc="The lender reads the farmer's credit score directly from the Stellar blockchain via ShambaChain's Soroban smart contract — no intermediary, no falsification possible." />
              <Step num="2" title="Lender approves & sends USDC via Stellar" desc="The lender triggers a USDC payment transaction on Stellar directly to the farmer's unique wallet address. Settlement is ~5 seconds. Transaction hash is recorded on-chain as proof of disbursement." />
              <Step num="3" title="Farmer receives USDC in their Stellar wallet" desc="USDC appears in the farmer's ShambaChain dashboard immediately. The farmer can convert to local currency via a Stellar anchor (e.g. Flutterwave, Chipper Cash, or M-Pesa USDC on-ramp)." />
              <Step num="4" title="Repayment sent back via Stellar" desc="Farmer initiates a USDC payment back to the lender's Stellar wallet through ShambaChain. This repayment is logged on-chain and triggers a +50 credit score bonus upon full repayment." />
            </div>
          </div>

          {/* Repayment assurance */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 24 }}>
              🔒 How are creditors assured of repayment?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                {
                  icon: Star,
                  title: 'Reputation is the collateral',
                  color: 'var(--gold)',
                  bg: 'var(--gold-pale)',
                  desc: 'A farmer\'s credit score is their most valuable asset on ShambaChain. Defaulting destroys it permanently. Farmers with high scores get larger loans — so repaying is directly in their financial interest.',
                },
                {
                  icon: Lock,
                  title: 'Smart contract escrow (roadmap)',
                  color: '#1565C0',
                  bg: '#BBDEFB',
                  desc: 'In v1.1, repayments will be locked in a Soroban escrow contract. Funds are released to the lender automatically on the due date, or rolled over with a penalty if delayed — removing any manual collection risk.',
                },
                {
                  icon: RefreshCw,
                  title: 'Crop insurance integration',
                  color: 'var(--leaf)',
                  bg: 'var(--leaf-ghost)',
                  desc: 'ShambaChain integrates with parametric crop insurance (triggered by satellite weather data). If a drought causes crop failure, the insurance pays the lender directly — protecting both parties without manual claims.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Overdue escalation system',
                  color: 'var(--danger,#C62828)',
                  bg: 'var(--danger-pale,#FFEBEE)',
                  desc: 'Missed repayments trigger automated alerts to the farmer via ShambaChain messaging. After 30 days, the loan is marked as overdue on-chain, reducing the credit score and blocking new loan applications until resolved.',
                },
              ].map(p => (
                <div key={p.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <p.icon size={18} color={p.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--soil)' }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--earth)', lineHeight: 1.7 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insurance payment flow */}
          <div className="card" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 24 }}>
              🌧️ Crop insurance payment flow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Step num="1" title="Farmer opts in to parametric insurance at loan time" desc="When applying for a loan, the farmer can opt into crop insurance. A small premium (% of loan) is deducted from the USDC loan and sent to the insurance pool contract on Stellar." color="#1565C0" />
              <Step num="2" title="Satellite triggers automatic payout" desc="ShambaChain's oracle monitors NDVI satellite data and rainfall indices for the farmer's GPS region. If a drought or flood event is detected, the smart contract triggers automatically — no claim needed." color="#1565C0" />
              <Step num="3" title="Insurer / pool pays the lender directly" desc="The insurance payout goes directly to the lender's Stellar wallet from the insurance pool contract. The farmer's loan is marked as covered. Both parties are protected." color="#1565C0" />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Judges' FAQ ──────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 64 }} />
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--leaf)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
               FAQ
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,36px)', color: 'var(--soil)' }}>
              Every hard question answered
            </h2>
          </div>

          <div>
            <Accordion q="What stops a farmer from just making up harvest records to get a better loan?">
              <p>Several overlapping safeguards make this self-defeating:</p>
              <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Blockchain permanence:</strong> Every entry is time-stamped and signed. You cannot add entries retroactively to inflate a score before applying — lenders can see the history timeline.</li>
                <li><strong>Score-based limits:</strong> A farmer who logs 10 harvests in one day will be flagged — the system detects abnormal entry velocity and reduces score weight for bulk entries.</li>
                <li><strong>GPS + satellite cross-check (v1.1):</strong> Crop satellite imagery will be compared to the claimed harvest quantities for the farmer's region. A maize harvest claimed during a known drought season will be automatically flagged.</li>
                <li><strong>Agent verification:</strong> Only agent-verified entries carry full score weight. Self-reported entries carry 70% weight — lenders can see the verification ratio.</li>
                <li><strong>Consequences:</strong> Fraud is detected after disbursement, the farmer is blacklisted on-chain permanently — their wallet address is flagged across the entire ShambaChain network in all 4 countries.</li>
              </ul>
            </Accordion>

            <Accordion q="What if a farmer loses their phone or secret key — do they lose everything?">
              ShambaChain separates identity from device. The farmer's credit history lives on the Stellar blockchain permanently — tied to their public key, not their phone.
              If a farmer loses their device but kept their secret key (shown and advised to save at registration), they can restore their full account on any device via the ShambaChain Login page.
              In v1.1 we plan a Social Recovery system: the farmer nominates 3 trusted contacts (family, cooperative officer, village elder). Any 2 of 3 can co-sign a key rotation — similar to how Stellar's multi-sig works.
            </Accordion>

            <Accordion q="How are cross-border loans handled across Kenya, Uganda, Ethiopia and Nigeria?">
              Stellar is inherently borderless. A lender in Kenya can disburse USDC to a farmer in Nigeria in ~5 seconds for a fraction of a cent.
              The farmer converts USDC to local currency via a Stellar anchor in their country — Flutterwave (Nigeria), Chipper Cash (pan-Africa), or local M-Pesa USDC on-ramps (Kenya/Uganda).
              ShambaChain's credit score is equally valid in all 4 countries — lenders can view and lend to farmers across borders through a single dashboard.
            </Accordion>

            <Accordion q="What prevents a lender from being dishonest — e.g. claiming they disbursed when they didn't?">
              All disbursements are Stellar transactions. The lender cannot claim they sent USDC without the actual on-chain transaction hash existing. ShambaChain reads disbursement status directly from the Stellar ledger — there is no self-reporting involved on the lender side.
              In the escrow model (v1.1), funds are locked into a Soroban smart contract at approval — the farmer can see the USDC is held in escrow before they accept the loan terms.
            </Accordion>

            <Accordion q="What happens if a farmer genuinely can't repay due to drought or crop failure?">
              This is exactly what the parametric crop insurance integration handles:
              <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>If insured: satellite-triggered payout covers the lender automatically. The farmer's credit score is not penalised for insured defaults.</li>
                <li>If not insured: the loan is marked overdue. After a 30-day grace period with lender-farmer messaging, the lender can mark the loan as a write-off. The farmer's score drops significantly but is not permanently blacklisted — they can rebuild over time.</li>
                <li>ShambaChain distinguishes between <em>unwilling</em> defaulters (score permanently flagged) and <em>unable</em> defaulters due to verified environmental events (score reduction only).</li>
              </ul>
            </Accordion>

            <Accordion q="Is ShambaChain regulated? What's the legal framework?">
              ShambaChain operates as a <strong>credit scoring and financial record infrastructure layer</strong> — not as a lender or insurer itself.
              The lending relationship is directly between verified lenders (registered microfinance institutions, SACCOs, or cooperatives) and farmers.
              In Kenya, lenders must be licensed by the Central Bank of Kenya. In Uganda by the Bank of Uganda. In Ethiopia by the National Bank of Ethiopia. In Nigeria by the CBN.
              ShambaChain provides the credit data layer only — similar to how Equifax or TransUnion provide credit scores without being lenders themselves.
              For the MVP, we operate on Stellar testnet. Mainnet launch will involve legal review in each target country.
            </Accordion>

            <Accordion q="Why Stellar and not Ethereum or another blockchain?">
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Cost:</strong> Stellar transactions cost ~$0.001 — essential for farmers making micro-transactions. Ethereum gas fees would make this unviable.</li>
                <li><strong>Speed:</strong> 3-5 second finality vs Ethereum's minutes. Farmers in rural areas need instant confirmation.</li>
                <li><strong>USDC native:</strong> Circle's USDC is natively issued on Stellar — no wrapping, no bridges, no extra risk.</li>
                <li><strong>Stellar Development Foundation's Africa focus:</strong> SDF actively funds African blockchain projects (this bootcamp is evidence) — meaning infrastructure, anchors, and regulatory support exist in our target markets.</li>
                <li><strong>Soroban smart contracts:</strong> Stellar's Rust-based smart contract platform gives us the security and expressiveness to build our credit scoring and escrow logic on-chain.</li>
              </ul>
            </Accordion>
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 48,
            background: 'linear-gradient(135deg, #0D3B28 0%, #1C1209 100%)',
            borderRadius: 20, padding: '40px', textAlign: 'center',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#F5EDD8', marginBottom: 12 }}>
              Ready to see it in action?
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(232,213,180,0.55)', marginBottom: 28, lineHeight: 1.7 }}>
              Register as a farmer, log a harvest, and watch your credit score update on the Stellar blockchain in real time.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/onboard')} style={{ gap: 10 }}>
                Register as Farmer <ArrowRight size={18} />
              </button>
              <button
                className="btn btn-lg"
                onClick={() => navigate('/lender')}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(245,237,216,0.85)' }}
              >
                View Lender Portal
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}