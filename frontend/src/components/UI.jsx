import React, { useEffect, useRef } from 'react'
import { useApp, scoreToTier } from '../context/AppContext.jsx'
import { CheckCircle, AlertCircle, Info, X, Inbox } from 'lucide-react'

// ── Toast Notification ────────────────────────────────────────────────────
export function Toast() {
  const { state, dispatch } = useApp()
  const n = state.notification
  if (!n) return null
  const icons = { success: CheckCircle, error: AlertCircle, info: Info, gold: Info }
  const styles = {
    success: { bg: 'var(--leaf-pale)', border: 'rgba(27,94,59,0.2)', color: 'var(--leaf)' },
    error:   { bg: 'var(--danger-pale)', border: 'rgba(198,40,40,0.2)', color: 'var(--danger)' },
    info:    { bg: 'var(--sky-pale)', border: 'rgba(21,101,192,0.2)', color: 'var(--sky)' },
    gold:    { bg: 'var(--gold-pale)', border: 'rgba(192,120,0,0.2)', color: 'var(--gold)' },
  }
  const s = styles[n.type] || styles.info
  const Icon = icons[n.type] || Info
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 'var(--r-md)', padding: '14px 18px',
      boxShadow: 'var(--shadow-lg)', maxWidth: 360,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      animation: 'fadeUp 0.3s ease both'
    }}>
      <Icon size={16} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 14, flex: 1 }}>{n.message}</span>
      <button onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION' })}
        style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', padding: 2, opacity: 0.6 }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ── Score Ring ────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 200, strokeWidth = 14 }) {
  const tier  = scoreToTier(score)
  const r     = (size - strokeWidth) / 2
  const cx    = size / 2
  const circ  = 2 * Math.PI * r
  const pct   = score / 850
  const dash  = pct * circ
  const gap   = circ - dash

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--sand)" strokeWidth={strokeWidth} />
        {/* Fill */}
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={tier.color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Tick marks */}
        {[0,100,200,300,400,500,600,700,800,850].map(tick => {
          const angle = (tick / 850) * 360 - 90
          const rad = angle * Math.PI / 180
          const inner = r - strokeWidth / 2 - 4
          const outer = r + strokeWidth / 2 + 4
          return (
            <line key={tick}
              x1={cx + inner * Math.cos(rad)} y1={cx + inner * Math.sin(rad)}
              x2={cx + outer * Math.cos(rad)} y2={cx + outer * Math.sin(rad)}
              stroke="var(--parchment)" strokeWidth={2}
            />
          )
        })}
      </svg>
      <div className="score-ring-center">
        <div className="score-big-num" style={{ color: tier.color, fontSize: size * 0.22 }}>{score}</div>
        <div style={{ fontSize: size * 0.065, color: 'var(--earth)', marginTop: 2 }}>/ 850</div>
        <div style={{
          marginTop: 6, fontSize: size * 0.07, fontWeight: 600,
          color: tier.color, display: 'flex', alignItems: 'center', gap: 4
        }}>
          {tier.emoji} {tier.label}
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="card animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-sm)',
            background: accent || 'var(--leaf-ghost)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={16} color="var(--leaf)" />
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--soil)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--earth)' }}>{sub}</div>}
    </div>
  )
}

// ── Score Bar ─────────────────────────────────────────────────────────────
export function ScoreBar({ label, value, max = 200, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--soil-60)', width: 130, flexShrink: 0 }}>{label}</div>
      <div className="progress-track" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color || 'var(--leaf)' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--soil)', width: 36, textAlign: 'right' }}>
        {value}<span style={{ color: 'var(--earth)', fontWeight: 400 }}>/{max}</span>
      </div>
    </div>
  )
}

// ── Page Loader ───────────────────────────────────────────────────────────
export function PageLoader({ message = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div className="spinner spinner-lg" />
      <p style={{ color: 'var(--earth)', fontSize: 14 }}>{message}</p>
    </div>
  )
}

// ── Step Loader (with messages) ───────────────────────────────────────────
export function StepLoader({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 20 }}>
      <div className="spinner spinner-lg" />
      <div style={{ textAlign: 'center', maxWidth: 300 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--soil)', marginBottom: 4 }}>
          {steps[currentStep] || steps[steps.length - 1]}
        </p>
        <p style={{ fontSize: 13, color: 'var(--earth)' }}>Please wait…</p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i <= currentStep ? 20 : 6, height: 6,
            borderRadius: 3,
            background: i <= currentStep ? 'var(--leaf)' : 'var(--sand)',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, description, action, actionLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--leaf-ghost)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
      }}>
        <Icon size={28} color="var(--leaf)" />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--soil)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--earth)', maxWidth: 280, margin: '0 auto 20px', lineHeight: 1.6 }}>{description}</p>
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action}>{actionLabel}</button>
      )}
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, actionLabel }) {
  return (
    <div className="flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--soil)', marginBottom: 2 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--earth)' }}>{subtitle}</p>}
      </div>
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action}>{actionLabel}</button>
      )}
    </div>
  )
}

// ── Tier Badge ────────────────────────────────────────────────────────────
export function TierBadge({ score, size = 'md' }) {
  const tier = scoreToTier(score)
  const pad  = size === 'sm' ? '2px 8px' : '4px 12px'
  const fs   = size === 'sm' ? 11 : 12
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, borderRadius: 'var(--r-full)',
      background: tier.bg, color: tier.color,
      fontSize: fs, fontWeight: 700
    }}>
      {tier.emoji} {tier.label}
    </span>
  )
}

// ── Wallet Display ────────────────────────────────────────────────────────
export function WalletCard({ publicKey, balance, farmerName }) {
  const [copied, setCopied] = React.useState(false)
  function copy() {
    navigator.clipboard.writeText(publicKey).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="wallet-card">
      <div style={{ fontSize: 11, color: 'rgba(232,213,180,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        🔐 Stellar Testnet Wallet
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--white)', marginBottom: 8 }}>
        {balance ?? '—'} <span style={{ fontSize: 14, color: 'var(--clay)', fontFamily: 'var(--font-body)' }}>XLM</span>
      </div>
      <button onClick={copy} style={{
        fontFamily: 'monospace', fontSize: 11, color: 'var(--clay)',
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--r-sm)', padding: '6px 10px', cursor: 'pointer',
        wordBreak: 'break-all', width: '100%', textAlign: 'left', marginBottom: 4
      }}>
        {publicKey}
      </button>
      <div style={{ fontSize: 11, color: 'rgba(232,213,180,0.4)' }}>
        {copied ? '✓ Copied to clipboard' : 'Click address to copy · Stellar Testnet'}
      </div>
    </div>
  )
}
