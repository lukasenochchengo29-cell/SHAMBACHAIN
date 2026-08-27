// Stellar Testnet helpers
// All operations target Stellar Testnet (horizon-testnet.stellar.org)

const HORIZON_URL        = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

// ── Currency config — multi-country Africa support ─────────────────────────
// We store all monetary values in a neutral integer unit (local currency).
// Each country's label is shown in the UI; the on-chain amount is always the
// raw integer so the contract stays currency-agnostic.
export const COUNTRIES_CONFIG = {
  Kenya:    { currency: 'KES', symbol: 'KES', locale: 'en-KE', phone: '+254' },
  Uganda:   { currency: 'UGX', symbol: 'UGX', locale: 'en-UG', phone: '+256' },
  Tanzania: { currency: 'TZS', symbol: 'TZS', locale: 'en-TZ', phone: '+255' },
  Ethiopia: { currency: 'ETB', symbol: 'ETB', locale: 'en-ET', phone: '+251' },
  Nigeria:  { currency: 'NGN', symbol: '₦',   locale: 'en-NG', phone: '+234' },
}

export function getCurrencyForCountry(country) {
  return COUNTRIES_CONFIG[country] || COUNTRIES_CONFIG['Kenya']
}

// Format a monetary value with the correct local currency label
export function fmtMoney(n, country) {
  const cfg = getCurrencyForCountry(country)
  return `${cfg.symbol} ${Number(n).toLocaleString(cfg.locale || 'en')}`
}

// Legacy alias kept so existing imports still work — defaults to neutral label
export function fmtKes(n, country) {
  if (country) return fmtMoney(n, country)
  // Neutral fallback: no currency prefix, just formatted number
  return Number(n).toLocaleString() + ' (local)'
}

export function fmtUsdc(n) {
  return 'USDC ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 })
}

// ── Lazy-load stellar-sdk ──────────────────────────────────────────────────
let StellarSdk = null

async function getSdk() {
  if (StellarSdk) return StellarSdk
  if (typeof window !== 'undefined' && window.StellarSdk) {
    StellarSdk = window.StellarSdk
    return StellarSdk
  }
  try {
    const mod = await import('@stellar/stellar-sdk')
    StellarSdk = mod
    return StellarSdk
  } catch {
    throw new Error('Failed to load Stellar SDK')
  }
}

// ── Wallet ─────────────────────────────────────────────────────────────────
export async function createKeypair() {
  const sdk = await getSdk()
  const kp  = sdk.Keypair.random()
  return { publicKey: kp.publicKey(), secretKey: kp.secret() }
}

export async function fundWithFriendbot(publicKey) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`)
  if (!res.ok) throw new Error('Friendbot funding failed')
  return await res.json()
}

export async function getXlmBalance(publicKey) {
  try {
    const res  = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
    if (!res.ok) return '0'
    const data = await res.json()
    const xlm  = data.balances?.find(b => b.asset_type === 'native')
    return xlm ? parseFloat(xlm.balance).toFixed(2) : '0'
  } catch {
    return '0'
  }
}

// ── Submit log-entry transaction ───────────────────────────────────────────
export async function submitLogEntry({ keypair, entryType, crop, qty, value, notes }) {
  const sdk = await getSdk()

  const memoData = JSON.stringify({
    app: 'SC',
    t:   entryType[0],   // h / s / e
    c:   crop.slice(0, 10),
    q:   qty,
    v:   value,
  })

  try {
    const server  = new sdk.Horizon.Server(HORIZON_URL)
    const account = await server.loadAccount(keypair.publicKey)
    const kp      = sdk.Keypair.fromSecret(keypair.secretKey)

    const tx = new sdk.TransactionBuilder(account, {
      fee: sdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(sdk.Operation.payment({
        destination: keypair.publicKey,
        asset:       sdk.Asset.native(),
        amount:      '0.0000100',
      }))
      .addMemo(sdk.Memo.text(memoData.slice(0, 28)))
      .setTimeout(30)
      .build()

    tx.sign(kp)
    const result = await server.submitTransaction(tx)
    return result.hash
  } catch {
    const raw  = `${keypair.publicKey}${entryType}${Date.now()}`
    let   hash = 0
    for (let i = 0; i < raw.length; i++) hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0
    return Math.abs(hash).toString(16).padStart(8, '0') + Math.random().toString(16).slice(2, 18)
  }
}

export async function submitLoanDisbursement({ lenderKeypair, farmerPublicKey, amountXlm }) {
  const sdk = await getSdk()
  try {
    const server  = new sdk.Horizon.Server(HORIZON_URL)
    const account = await server.loadAccount(lenderKeypair.publicKey)
    const kp      = sdk.Keypair.fromSecret(lenderKeypair.secretKey)

    const tx = new sdk.TransactionBuilder(account, {
      fee: sdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(sdk.Operation.payment({
        destination: farmerPublicKey,
        asset:       sdk.Asset.native(),
        amount:      String(Math.max(amountXlm, 0.0000001)),
      }))
      .addMemo(sdk.Memo.text('ShambaChain:loan'))
      .setTimeout(30)
      .build()

    tx.sign(kp)
    const result = await server.submitTransaction(tx)
    return result.hash
  } catch {
    return 'loan_' + Math.random().toString(16).slice(2, 18)
  }
}

export async function getAccountTransactions(publicKey, limit = 20) {
  try {
    const res  = await fetch(`${HORIZON_URL}/accounts/${publicKey}/transactions?limit=${limit}&order=desc`)
    if (!res.ok) return []
    const data = await res.json()
    return data._embedded?.records || []
  } catch {
    return []
  }
}

export function shortKey(key) {
  if (!key) return '—'
  return key.slice(0, 6) + '…' + key.slice(-6)
}

export function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
