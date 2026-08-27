import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Toast } from '../components/UI.jsx'
import { Sprout, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { getXlmBalance, delay } from '../utils/stellarUtils.js'

export default function Login() {
  const navigate = useNavigate()
  const { state, dispatch, notify } = useApp()
  const [secretKey, setSecretKey]   = useState('')
  const [showKey,   setShowKey]     = useState(false)
  const [loading,   setLoading]     = useState(false)
  const [error,     setError]       = useState('')
  const [stepMsg,   setStepMsg]     = useState('')

  // Already logged in — go straight to dashboard
  if (state.farmer) {
    navigate('/dashboard')
    return null
  }

  async function handleLogin() {
    setError('')
    setStepMsg('')
    const key = secretKey.trim()

    if (!key)                           { setError('Please enter your secret key'); return }
    if (!key.startsWith('S'))           { setError('Secret keys start with the letter "S"'); return }
    if (key.length !== 56)              { setError(`Key must be exactly 56 characters (yours is ${key.length})`); return }

    setLoading(true)
    try {
      // ── Step 1: load Stellar SDK and derive public key ──────────────────
      setStepMsg('Verifying secret key…')
      let StellarSdk = null
      try {
        const mod  = await import('@stellar/stellar-sdk')
        StellarSdk = mod.default || mod
      } catch (_) {}
      if (!StellarSdk && typeof window !== 'undefined' && window.StellarSdk) {
        StellarSdk = window.StellarSdk
      }
      if (!StellarSdk) {
        setError('Stellar SDK failed to load. Please refresh the page and try again.')
        setLoading(false)
        return
      }

      let keypairObj
      try {
        keypairObj = StellarSdk.Keypair.fromSecret(key)
      } catch {
        setError('Invalid secret key. Please check for typos — secret keys are exactly 56 characters starting with "S".')
        setLoading(false)
        return
      }
      const publicKey = keypairObj.publicKey()

      // ── Step 2: look up session in localStorage ─────────────────────────
      setStepMsg('Looking up your account…')
      await delay(400)

      let restoredFarmer = null
      let restoredTxns   = []
      let restoredLoans  = []
      let restoredLive   = []
      let foundSource    = ''

      // 2a. Check the active session first
      try {
        const session = localStorage.getItem('shambachain_session')
        if (session) {
          const parsed = JSON.parse(session)
          if (parsed?.keypair?.publicKey === publicKey || parsed?.keypair?.secretKey === key) {
            restoredFarmer = parsed.farmer
            restoredTxns   = parsed.transactions || []
            restoredLoans  = parsed.loans        || []
            restoredLive   = parsed.liveFarmers  || []
            foundSource    = 'session'
          }
        }
      } catch { /* corrupt data — continue */ }

      // 2b. Check the backup keyed directly by public key
      if (!restoredFarmer) {
        try {
          const backup = localStorage.getItem('shambachain_backup_' + publicKey)
          if (backup) {
            const parsed = JSON.parse(backup)
            restoredFarmer = parsed.farmer
            restoredTxns   = parsed.transactions || []
            restoredLoans  = parsed.loans        || []
            restoredLive   = parsed.liveFarmers  || []
            foundSource    = 'backup'
          }
        } catch { /* corrupt */ }
      }

      // 2c. Scan ALL backup keys (handles edge cases)
      if (!restoredFarmer) {
        for (let i = 0; i < localStorage.length; i++) {
          const lsKey = localStorage.key(i)
          if (!lsKey?.startsWith('shambachain_backup_')) continue
          try {
            const parsed = JSON.parse(localStorage.getItem(lsKey))
            const storedPub = parsed?.keypair?.publicKey
            const storedSec = parsed?.keypair?.secretKey
            if (storedPub === publicKey || storedSec === key) {
              restoredFarmer = parsed.farmer
              restoredTxns   = parsed.transactions || []
              restoredLoans  = parsed.loans        || []
              restoredLive   = parsed.liveFarmers  || []
              foundSource    = 'scan'
              break
            }
          } catch { /* skip corrupt */ }
        }
      }

      // ── Step 3: restore or show clear error ─────────────────────────────
      if (restoredFarmer) {
        setStepMsg('Restoring your account…')
        await delay(500)

        const balance = await getXlmBalance(publicKey)

        // Dispatch everything back into React state
        dispatch({ type: 'SET_FARMER',       payload: restoredFarmer })
        dispatch({ type: 'SET_KEYPAIR',       payload: { publicKey, secretKey: key } })
        dispatch({ type: 'SET_TRANSACTIONS',  payload: restoredTxns })
        dispatch({ type: 'SET_XLM_BALANCE',   payload: balance })
        restoredLoans.forEach(l => dispatch({ type: 'ADD_LOAN', payload: l }))

        // Restore live farmer entry in lender portal
        const liveEntry = restoredLive.length > 0 ? restoredLive[0] : {
          id:        'LIVE',
          name:      `${restoredFarmer.fname} ${restoredFarmer.lname}`,
          country:   restoredFarmer.country || 'Kenya',
          region:    restoredFarmer.region  || restoredFarmer.county || '',
          crop:      restoredFarmer.crop    || '',
          acres:     restoredFarmer.acres   || '',
          txns:      restoredTxns.length,
          income:    restoredTxns.filter(t => t.type === 'sale').reduce((s, t) => s + (t.value || 0), 0),
          score:     100,
          tier:      'Unranked',
          avatar:    `${restoredFarmer.fname[0]}${restoredFarmer.lname[0]}`,
          loan:      false,
          isLive:    true,
          publicKey,
        }
        dispatch({ type: 'ADD_LENDER_FARMER', payload: liveEntry })

        // Re-write the session so it's fresh with the correct secret key
        const freshSession = {
          farmer:       restoredFarmer,
          keypair:      { publicKey, secretKey: key },
          transactions: restoredTxns,
          loans:        restoredLoans,
          liveFarmers:  [liveEntry],
        }
        try {
          localStorage.setItem('shambachain_session', JSON.stringify(freshSession))
          localStorage.setItem('shambachain_backup_' + publicKey, JSON.stringify(freshSession))
        } catch { /* storage full — not fatal */ }

        notify('success', `Welcome back, ${restoredFarmer.fname}! Your account has been restored.`)
        navigate('/dashboard')

      } else {
        // ── Key is valid Stellar key but no local data found ───────────────
        // This means the user registered on a different browser/device
        // or cleared their browser data.
        setError(
          'Your secret key is valid on the Stellar network, but no local profile was found in this browser. ' +
          'This happens when you registered on a different device or cleared browser storage. ' +
          'Please register again below — your Stellar wallet address will be exactly the same (no XLM lost).'
        )
      }

    } catch (err) {
      setError('An unexpected error occurred: ' + (err.message || 'Please try again.'))
    } finally {
      setLoading(false)
      setStepMsg('')
    }
  }

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px',
    }}>
      <Toast />
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--leaf-ghost)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Sprout size={28} color="var(--leaf)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--earth)', lineHeight: 1.6 }}>
            Enter your Stellar secret key to restore your farm account and wallet.
          </p>
        </div>

        <div className="card">
          {/* Info box */}
          <div style={{
            background: 'var(--leaf-ghost)', borderRadius: 'var(--r-sm)',
            padding: '12px 16px', marginBottom: 24,
            fontSize: 13, color: 'var(--leaf)', lineHeight: 1.6,
          }}>
            <strong>🔑 How login works on ShambaChain:</strong><br />
            Your account is tied to your Stellar secret key — the 56-character
            key starting with "S" that was shown during registration.
            Paste it below to restore your wallet, credit score, and all your farm records.
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Your Stellar Secret Key</label>
            <div style={{ position: 'relative' }}>
              <input
                className={`form-input ${error ? 'error' : ''}`}
                type={showKey ? 'text' : 'password'}
                placeholder="S... (56 characters)"
                value={secretKey}
                onChange={e => { setSecretKey(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ paddingRight: 44, fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.04em' }}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--earth)', display: 'flex', padding: 2,
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Live character count */}
            {secretKey.length > 0 && (
              <div style={{ fontSize: 11, marginTop: 4, color: secretKey.length === 56 ? 'var(--leaf)' : 'var(--earth)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {secretKey.length === 56
                  ? <><CheckCircle size={11} color="var(--leaf)" /> Correct length (56 characters)</>
                  : <>{secretKey.length}/56 characters</>
                }
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              background: 'var(--danger-pale)', border: '1px solid rgba(198,40,40,0.2)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px',
              fontSize: 13, color: 'var(--danger)', lineHeight: 1.6, marginBottom: 16,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Step message while loading */}
          {loading && stepMsg && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: 'var(--leaf-ghost)', borderRadius: 'var(--r-sm)',
              padding: '10px 14px', fontSize: 13, color: 'var(--leaf)', marginBottom: 16,
            }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              {stepMsg}
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--earth)', marginBottom: 20, lineHeight: 1.6 }}>
            🔒 Your key never leaves your browser. ShambaChain has zero access to it.
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: 15 }}
            onClick={handleLogin}
            disabled={loading || secretKey.length === 0}
          >
            {loading
              ? <><span className="spinner" /> {stepMsg || 'Restoring your account…'}</>
              : <>Restore My Account <ArrowRight size={16} /></>
            }
          </button>

          <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--earth)', marginBottom: 12 }}>
              Don't have an account yet?
            </p>
            <button
              className="btn btn-outline"
              style={{ width: '100%' }}
              onClick={() => navigate('/onboard')}
            >
              Register as a new farmer →
            </button>
          </div>
        </div>

        {/* Where to find key */}
        <div style={{
          marginTop: 20, padding: '16px 20px',
          background: 'var(--gold-pale)', borderRadius: 'var(--r-md)',
          border: '1px solid rgba(192,120,0,0.15)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-deep)', marginBottom: 8 }}>
            ⚠️ Where is my secret key?
          </div>
          <div style={{ fontSize: 12, color: 'var(--gold-deep)', lineHeight: 1.7, opacity: 0.85 }}>
            Your secret key was shown once during registration.
            It looks like: <strong style={{ fontFamily: 'monospace' }}>SXXXXXXXXX...XXX</strong> (56 chars starting with S).
            If you saved it (notes app, paper, password manager), retrieve it from there.
            If lost, register again — your Stellar wallet address will be the same if you use the same key.
          </div>
        </div>

      </div>
    </div>
  )
}