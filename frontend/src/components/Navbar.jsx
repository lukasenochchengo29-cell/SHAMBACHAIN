import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { shortKey } from '../utils/stellarUtils.js'
import { Menu, X, Sprout, LayoutDashboard, FileText, Star, Landmark, History, LogOut } from 'lucide-react'

export default function Navbar() {
  const { state, dispatch, notify } = useApp()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const farmerLinks = [
    { path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { path: '/log',          label: 'Log Entry',    icon: FileText },
    { path: '/credit-score', label: 'Credit Score', icon: Star },
    { path: '/loan',         label: 'Loan',         icon: Landmark },
    { path: '/transactions', label: 'History',      icon: History },
  ]

  function handleLogout() {
    localStorage.removeItem('shambachain_session')
    dispatch({ type: 'LOAD_PERSISTED', payload: { farmer: null, keypair: null, transactions: [], loans: [] } })
    notify('info', 'Logged out successfully')
    navigate('/')
    setMobileOpen(false)
  }

  return (
    <nav style={{
      background: 'var(--soil)',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Full-width inner: logo on left, nav on far right */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Sprout size={22} color="#4CAF77" />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 21,
              fontWeight: 500,
              color: '#E8D5B4',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              Shamba<span style={{ color: '#4CAF77' }}>Chain</span>
            </span>
          </div>
        </button>

        {/* ── Desktop nav — pushed all the way right ───────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          className="desktop-nav">

          {state.farmer ? (
            <>
              {/* Farmer page links */}
              {farmerLinks.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    background: isActive(path) ? 'rgba(255,255,255,0.08)' : 'none',
                    border: 'none',
                    color: isActive(path) ? '#E8D5B4' : 'rgba(232,213,180,0.55)',
                    padding: '6px 11px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.color = '#E8D5B4'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!isActive(path)) { e.currentTarget.style.color = 'rgba(232,213,180,0.55)'; e.currentTarget.style.background = 'none' } }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}

              {/* Trust page */}
              <button
                onClick={() => navigate('/trust')}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(232,213,180,0.55)', padding: '6px 11px',
                  borderRadius: 20, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 5, fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                🛡️ Trust
              </button>

              {/* Separator */}
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

              {/* Lender Portal */}
              <button
                onClick={() => navigate('/lender')}
                style={{
                  background: isActive('/lender') ? 'rgba(255,255,255,0.08)' : 'none',
                  border: 'none',
                  color: isActive('/lender') ? '#E8D5B4' : 'rgba(232,213,180,0.55)',
                  padding: '6px 11px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <Landmark size={13} /> Lender Portal
              </button>

              {/* Separator */}
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

              {/* Farmer avatar chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 999, padding: '5px 12px 5px 5px',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--leaf)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {state.farmer.fname?.[0]}{state.farmer.lname?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#E8D5B4', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {state.farmer.fname} {state.farmer.lname}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(232,213,180,0.4)', fontFamily: 'monospace' }}>
                    {shortKey(state.keypair?.publicKey)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(232,213,180,0.35)', cursor: 'pointer',
                    padding: '2px', display: 'flex', alignItems: 'center',
                    marginLeft: 2, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E8D5B4'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,213,180,0.35)'}
                >
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            /* Not logged in — just Lender Portal + Get Started */
            <>
              <button
                onClick={() => navigate('/lender')}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(232,213,180,0.6)',
                  padding: '6px 14px', borderRadius: 20,
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8D5B4'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,213,180,0.6)'}
              >
                Lender Portal
              </button>

              <button
                onClick={() => navigate('/trust')}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(232,213,180,0.6)',
                  padding: '6px 14px', borderRadius: 20,
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8D5B4'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,213,180,0.6)'}
              >
                How it works
              </button>

              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(232,213,180,0.6)',
                  padding: '6px 14px', borderRadius: 20,
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8D5B4'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,213,180,0.6)'}
              >
                Log In
              </button>

              <button
                onClick={() => navigate('/onboard')}
                style={{
                  background: 'var(--leaf,#1B5E3B)',
                  border: 'none',
                  color: 'white',
                  padding: '9px 20px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginLeft: 6,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2D7D52'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--leaf,#1B5E3B)'; e.currentTarget.style.transform = 'none' }}
              >
                Get Started →
              </button>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────────────── */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#E8D5B4',
            width: 38, height: 38,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          className="mobile-menu-btn"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: 64, left: 0, right: 0,
          background: '#1C1209',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 20px 24px',
          zIndex: 200,
          animation: 'slideDown 0.2s ease both',
        }}>
          {state.farmer ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 10,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--leaf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                  {state.farmer.fname?.[0]}{state.farmer.lname?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#E8D5B4' }}>{state.farmer.fname} {state.farmer.lname}</div>
                  <div style={{ fontSize: 10, color: 'rgba(232,213,180,0.4)', fontFamily: 'monospace' }}>{shortKey(state.keypair?.publicKey)}</div>
                </div>
              </div>
              {[...farmerLinks, { path: '/lender', label: 'Lender Portal', icon: Landmark }].map(({ path, label, icon: Icon }) => (
                <button key={path}
                  onClick={() => { navigate(path); setMobileOpen(false) }}
                  style={{
                    display: 'flex', gap: 10, width: '100%', alignItems: 'center',
                    background: isActive(path) ? 'rgba(255,255,255,0.06)' : 'none',
                    border: 'none', color: isActive(path) ? '#E8D5B4' : 'rgba(232,213,180,0.6)',
                    padding: '11px 12px', borderRadius: 8, marginBottom: 2,
                    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
              <button onClick={handleLogout}
                style={{
                  display: 'flex', gap: 10, width: '100%', alignItems: 'center',
                  background: 'none', border: 'none', color: 'rgba(232,213,180,0.4)',
                  padding: '11px 12px', borderRadius: 8, marginTop: 6,
                  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('/lender'); setMobileOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(232,213,180,0.6)', padding: '11px 12px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
              >
                Lender Portal
              </button>
              <button onClick={() => { navigate('/onboard'); setMobileOpen(false) }}
                style={{ width: '100%', background: 'var(--leaf)', border: 'none', color: 'white', padding: '12px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Get Started →
              </button>
            </>
          )}
        </div>
      )}

      {/* Responsive styles injected inline */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 901px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </nav>
  )
}