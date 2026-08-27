import React, { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

// ── Demo seed transactions — pan-Africa, all 4 countries ──────────────────
const DEMO_TRANSACTIONS = [
  { id:1,  type:'harvest', crop:'Maize',   qty:820,  value:24600, date:'2025-01-15', notes:'First season harvest – good rains',          hash:'a1b2c3d4e5f6demo01', country:'Kenya'    },
  { id:2,  type:'sale',    crop:'Maize',   qty:400,  value:12000, date:'2025-01-28', notes:'Sold to local grain market',                  hash:'b2c3d4e5f6a1demo02', country:'Kenya'    },
  { id:3,  type:'expense', crop:'General', qty:0,    value:3500,  date:'2025-02-05', notes:'Fertiliser – 50kg × 2 bags',                  hash:'c3d4e5f6a1b2demo03', country:'Kenya'    },
  { id:4,  type:'harvest', crop:'Beans',   qty:150,  value:9000,  date:'2025-02-18', notes:'Intercrop beans alongside maize',             hash:'d4e5f6a1b2c3demo04', country:'Kenya'    },
  { id:5,  type:'sale',    crop:'Beans',   qty:150,  value:9000,  date:'2025-02-24', notes:'Direct sale – local buyer',                   hash:'e5f6a1b2c3d4demo05', country:'Kenya'    },
  { id:6,  type:'harvest', crop:'Maize',   qty:950,  value:28500, date:'2025-03-10', notes:'Second season – bumper harvest',              hash:'f6a1b2c3d4e5demo06', country:'Kenya'    },
  { id:7,  type:'sale',    crop:'Maize',   qty:700,  value:21000, date:'2025-03-22', notes:'Sold 700kg to grain depot',                   hash:'a1b2c3d4f6e5demo07', country:'Kenya'    },
  { id:8,  type:'expense', crop:'General', qty:0,    value:5000,  date:'2025-04-02', notes:'Labour – weeding & ploughing',                hash:'b2c3d4e5a1f6demo08', country:'Kenya'    },
  { id:9,  type:'harvest', crop:'Kale',    qty:200,  value:4000,  date:'2025-04-14', notes:'Sukuma wiki – weekly harvest',                hash:'c3d4e5f6b2a1demo09', country:'Kenya'    },
  { id:10, type:'sale',    crop:'Kale',    qty:200,  value:4000,  date:'2025-04-18', notes:'Sold at local market',                        hash:'d4e5f6a1c3b2demo10', country:'Kenya'    },
]

// ── Seed lender farmers — all 4 MVP countries ─────────────────────────────
const SEED_LENDER_FARMERS = [
  // Kenya
  { id:'L1', name:'Wanjiku Mwangi',    country:'Kenya',    region:'Nakuru',          crop:'Maize',    acres:'3.5', txns:47, income:185000, score:742, tier:'Gold',     avatar:'WM', loan:false, verificationRatio:68 },
  { id:'L2', name:'Kipchoge Ochieng',  country:'Kenya',    region:'Uasin Gishu',     crop:'Wheat',    acres:'5.0', txns:31, income:220000, score:618, tier:'Silver',   avatar:'KO', loan:true  },
  // Uganda
  { id:'L3', name:'Amina Nakato',      country:'Uganda',   region:'Wakiso',          crop:'Banana',   acres:'2.0', txns:12, income:940000, score:445, tier:'Bronze',   avatar:'AN', loan:false },
  { id:'L4', name:'Okello James',      country:'Uganda',   region:'Gulu',            crop:'Maize',    acres:'4.2', txns:58, income:310000, score:791, tier:'Platinum', avatar:'OJ', loan:false, verificationRatio:82 },
  // Ethiopia
  { id:'L5', name:'Tigist Alemu',      country:'Ethiopia', region:'Oromia',          crop:'Coffee',   acres:'3.0', txns:22, income:48000,  score:530, tier:'Silver',   avatar:'TA', loan:false },
  { id:'L6', name:'Bekele Haile',      country:'Ethiopia', region:'Amhara',          crop:'Teff',     acres:'2.5', txns:8,  income:22000,  score:285, tier:'Unranked', avatar:'BH', loan:false },
  // Nigeria
  { id:'L7', name:'Chinyere Obi',      country:'Nigeria',  region:'Enugu',           crop:'Cassava',  acres:'5.5', txns:34, income:820000, score:674, tier:'Gold',     avatar:'CO', loan:false, verificationRatio:45 },
  { id:'L8', name:'Musa Abubakar',     country:'Nigeria',  region:'Kano',            crop:'Groundnut',acres:'3.0', txns:19, income:450000, score:512, tier:'Silver',   avatar:'MA', loan:true  },
]

// ── Reducer ───────────────────────────────────────────────────────────────
const initialState = {
  farmer:        null,
  keypair:       null,
  transactions:  [],
  loans:         [],
  lenderFarmers: SEED_LENDER_FARMERS,
  xlmBalance:    null,
  isLoading:     false,
  notification:  null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FARMER':         return { ...state, farmer:       action.payload }
    case 'SET_KEYPAIR':        return { ...state, keypair:      action.payload }
    case 'SET_TRANSACTIONS':   return { ...state, transactions: action.payload }
    case 'ADD_TRANSACTION':    return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'ADD_LOAN':           return { ...state, loans:        [action.payload, ...state.loans] }
    case 'UPDATE_LOAN':        return { ...state, loans:        state.loans.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'SET_XLM_BALANCE':    return { ...state, xlmBalance:   action.payload }
    case 'SET_LOADING':        return { ...state, isLoading:    action.payload }
    case 'SET_NOTIFICATION':   return { ...state, notification: action.payload }
    case 'CLEAR_NOTIFICATION': return { ...state, notification: null }
    case 'ADD_LENDER_FARMER': {
      // Remove any existing entry with the same id OR same publicKey before adding
      const filtered = state.lenderFarmers.filter(f =>
        f.id !== action.payload.id &&
        !(f.publicKey && f.publicKey === action.payload.publicKey)
      )
      return { ...state, lenderFarmers: [...filtered, action.payload] }
    }
    case 'UPDATE_FARMER_SCORE': {
      const updated = state.lenderFarmers.map(f =>
        f.id === 'LIVE'
          ? { ...f, score: action.payload.score, tier: action.payload.tier, txns: action.payload.txns }
          : f
      )
      return { ...state, lenderFarmers: updated }
    }
    case 'LOAD_PERSISTED':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

// ── Credit score engine — mirrors Soroban contract score.rs ───────────────
// Currency-agnostic: value is always the raw integer the farmer entered.
// The scoring threshold (÷500) was originally tuned for KES; we apply a
// per-country multiplier so farmers in high-denomination currencies (UGX,
// NGN) aren't unfairly penalised.
const INCOME_DIVISORS = {
  Kenya:    500,    // KES  — baseline
  Uganda:   18000,  // UGX  — ~36× KES
  Ethiopia: 30,     // ETB  — ~0.06× KES  (ETB is smaller)
  Nigeria:  700,    // NGN  — ~1.4× KES
}

export function calculateScore(transactions, country = 'Kenya') {
  const harvests = transactions.filter(t => t.type === 'harvest').length
  const sales    = transactions.filter(t => t.type === 'sale').length
  const income   = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.value, 0)
  const total    = transactions.length
  const divisor  = INCOME_DIVISORS[country] ?? 500

  const freq  = Math.min(harvests * 25, 200)
  const cons  = Math.min(sales * 30,    200)
  const grow  = Math.min(Math.floor(income / divisor), 200)
  const reg   = Math.min(total * 10,    150)
  return Math.min(100 + freq + cons + grow + reg, 850)
}

export function scoreToTier(score) {
  if (score >= 750) return { label:'Platinum', emoji:'💎', color:'#006064', bg:'#E0F7FA', maxLoan:5000 }
  if (score >= 650) return { label:'Gold',     emoji:'🥇', color:'#C07800', bg:'#FFF3CD', maxLoan:2000 }
  if (score >= 500) return { label:'Silver',   emoji:'🥈', color:'#607D8B', bg:'#ECEFF1', maxLoan:800  }
  if (score >= 300) return { label:'Bronze',   emoji:'🥉', color:'#8B4513', bg:'#FBE8D8', maxLoan:200  }
  return               { label:'Unranked', emoji:'🌱', color:'#8B6347', bg:'#F2EAD6', maxLoan:50   }
}

// ── Provider ──────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shambachain_session')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge saved live farmers back into the seed list — deduplicated
        const liveFarmers = parsed.liveFarmers || []
        // Seeds that don't clash with any live farmer (by id or publicKey)
        const seeds = SEED_LENDER_FARMERS.filter(seed =>
          !liveFarmers.find(lf =>
            lf.id === seed.id ||
            (lf.publicKey && lf.publicKey === seed.publicKey)
          )
        )
        const merged = [...seeds, ...liveFarmers]
        dispatch({ type:'LOAD_PERSISTED', payload:{ ...parsed, lenderFarmers: merged } })
      }
    } catch (_) {}
  }, [])

  // Persist session
  useEffect(() => {
    if (state.farmer) {
      try {
        // Also persist the lenderFarmers so the live farmer survives page refresh
        const liveFarmers = state.lenderFarmers.filter(f => f.isLive)
        localStorage.setItem('shambachain_session', JSON.stringify({
          farmer:        state.farmer,
          keypair:       state.keypair,
          transactions:  state.transactions,
          loans:         state.loans,
          liveFarmers,
        }))
      } catch (_) {}
    }
  }, [state.farmer, state.keypair, state.transactions, state.loans, state.lenderFarmers])

  // Auto-dismiss notifications
  useEffect(() => {
    if (state.notification) {
      const t = setTimeout(() => dispatch({ type:'CLEAR_NOTIFICATION' }), 5000)
      return () => clearTimeout(t)
    }
  }, [state.notification])

  const notify = (type, message) =>
    dispatch({ type:'SET_NOTIFICATION', payload:{ type, message } })

  return (
    <AppContext.Provider value={{ state, dispatch, notify, calculateScore, scoreToTier }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}