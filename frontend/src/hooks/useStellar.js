import { useState, useCallback } from 'react'
import { useApp, calculateScore, scoreToTier } from '../context/AppContext.jsx'
import {
  createKeypair,
  fundWithFriendbot,
  getXlmBalance,
  submitLogEntry,
  delay,
} from '../utils/stellarUtils.js'

export function useStellar() {
  const { state, dispatch, notify } = useApp()
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(0)

  // ── Create wallet and onboard farmer ──────────────────────────────────────
  const onboardFarmer = useCallback(async (formData) => {
    setLoading(true)
    setStep(0)
    try {
      setStep(0)
      await delay(600)
      const kp = await createKeypair()

      setStep(1) // Funding
      try { await fundWithFriendbot(kp.publicKey) } catch { /* testnet ok */ }
      await delay(1000)

      setStep(2) // Saving
      await delay(400)

      const farmer = {
        ...formData,
        publicKey:    kp.publicKey,
        registeredAt: new Date().toISOString(),
      }

      // Build the lender-portal entry for this farmer
      const liveEntry = {
        id:        'LIVE',
        name:      `${formData.fname} ${formData.lname}`,
        country:   formData.country  || 'Kenya',
        region:    formData.region   || formData.county || '',
        crop:      formData.crop     || '',
        acres:     formData.acres    || '',
        txns:      0,
        income:    0,
        score:     100,
        tier:      'Unranked',
        avatar:    `${formData.fname[0]}${formData.lname[0]}`,
        loan:      false,
        isLive:    true,
        publicKey: kp.publicKey,
      }

      // ── Write EVERYTHING to localStorage IMMEDIATELY ──────────────────────
      // Do not rely on React useEffect timing — write synchronously right here
      // so Login can always find it, even if the user logs out one second later.
      const sessionData = {
        farmer,
        keypair:      kp,
        transactions: [],
        loans:        [],
        liveFarmers:  [liveEntry],
      }

      try {
        // Primary session key
        localStorage.setItem('shambachain_session', JSON.stringify(sessionData))
        // Backup keyed by public key (survives session clear)
        localStorage.setItem('shambachain_backup_' + kp.publicKey, JSON.stringify(sessionData))
      } catch (e) {
        console.warn('localStorage write failed:', e)
      }

      // ── Dispatch to React state AFTER localStorage is written ─────────────
      dispatch({ type: 'SET_FARMER',        payload: farmer })
      dispatch({ type: 'SET_KEYPAIR',       payload: kp })
      dispatch({ type: 'SET_TRANSACTIONS',  payload: [] })
      dispatch({ type: 'ADD_LENDER_FARMER', payload: liveEntry })

      notify('success', `Welcome, ${formData.fname}! Your Stellar wallet is ready.`)
      return { success: true, keypair: kp }

    } catch (err) {
      notify('error', 'Registration failed. Please try again.')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setStep(0)
    }
  }, [dispatch, notify])

  // ── Refresh XLM balance ────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!state.keypair?.publicKey) return
    try {
      const bal = await getXlmBalance(state.keypair.publicKey)
      dispatch({ type: 'SET_XLM_BALANCE', payload: bal })
    } catch { /* silent */ }
  }, [state.keypair, dispatch])

  // ── Log a harvest / sale / expense ────────────────────────────────────────
  const logEntry = useCallback(async ({ entryType, crop, qty, value, date, notes }) => {
    if (!state.keypair) return { success: false, error: 'No wallet found' }
    setLoading(true)
    try {
      const hash = await submitLogEntry({
        keypair:   state.keypair,
        entryType,
        crop,
        qty:       parseInt(qty)   || 0,
        value:     parseInt(value) || 0,
        notes,
      })

      const newTx = {
        id:           Date.now(),
        type:         entryType,
        crop,
        qty:          parseInt(qty)   || 0,
        value:        parseInt(value) || 0,
        date,
        notes,
        hash,
        timestamp:    new Date().toISOString(),
        verification: 'SelfReported',
      }

      dispatch({ type: 'ADD_TRANSACTION', payload: newTx })

      // Update lender portal score for this farmer
      const allTx    = [newTx, ...state.transactions]
      const newScore = calculateScore(allTx, state.farmer?.country)
      const tier     = scoreToTier(newScore)
      dispatch({
        type: 'UPDATE_FARMER_SCORE',
        payload: { score: newScore, tier: tier.label, txns: allTx.length },
      })

      // Persist updated transactions synchronously to backup
      try {
        const existing = JSON.parse(localStorage.getItem('shambachain_backup_' + state.keypair.publicKey) || '{}')
        const updated  = { ...existing, transactions: allTx }
        localStorage.setItem('shambachain_backup_' + state.keypair.publicKey, JSON.stringify(updated))
      } catch { /* silent */ }

      notify('success', `${entryType.charAt(0).toUpperCase() + entryType.slice(1)} recorded on Stellar! Hash: ${hash.slice(0,10)}…`)
      return { success: true, hash, tx: newTx }
    } catch (err) {
      notify('error', `Failed to log entry: ${err.message}`)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [state.keypair, state.transactions, state.farmer, dispatch, notify])

  // ── Apply for a loan ───────────────────────────────────────────────────────
  const applyLoan = useCallback(async ({ amount, period, purpose, lenderAddress }) => {
    if (!state.farmer) return { success: false }
    setLoading(true)
    try {
      await delay(1800)
      const loanId  = `LOAN-${Date.now()}`
      const newLoan = {
        id:            loanId,
        farmer:        state.keypair?.publicKey,
        lenderAddress: lenderAddress || 'GBMQX…LENDER',
        amountUsdc:    parseInt(amount),
        periodMonths:  parseInt(period),
        purpose,
        status:        'Pending',
        appliedAt:     new Date().toISOString(),
        approvedAt:    null,
        repaidAmount:  0,
      }
      dispatch({ type: 'ADD_LOAN', payload: newLoan })
      notify('gold', `Loan application for USDC ${amount} submitted successfully!`)
      return { success: true, loan: newLoan }
    } catch (err) {
      notify('error', 'Loan application failed.')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }, [state.farmer, state.keypair, dispatch, notify])

  // ── Simulate lender approving a loan ──────────────────────────────────────
  const approveLoan = useCallback(async (loanId, amount) => {
    setLoading(true)
    try {
      await delay(2000)
      const fakeHash = 'disburse_' + Math.random().toString(16).slice(2, 14)
      dispatch({
        type: 'UPDATE_LOAN',
        payload: {
          id:          loanId,
          status:      'Disbursed',
          approvedAt:  new Date().toISOString(),
          hash:        fakeHash,
          amountUsdc:  amount,
          repaidAmount: 0,
        },
      })
      notify('success', `Loan approved! USDC ${amount} disbursed on Stellar. Tx: ${fakeHash.slice(0,12)}…`)
      return { success: true, hash: fakeHash }
    } catch {
      return { success: false }
    } finally {
      setLoading(false)
    }
  }, [dispatch, notify])

  return {
    loading,
    step,
    onboardFarmer,
    refreshBalance,
    logEntry,
    applyLoan,
    approveLoan,
  }
}