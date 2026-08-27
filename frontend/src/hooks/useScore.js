import { useMemo } from 'react'
import { useApp, calculateScore, scoreToTier } from '../context/AppContext.jsx'
import { getCurrencyForCountry } from '../utils/stellarUtils.js'

export function useScore() {
  const { state }    = useApp()
  const transactions = state.transactions
  const country      = state.farmer?.country || 'Kenya'
  const currency     = getCurrencyForCountry(country)

  const score = useMemo(() => calculateScore(transactions, country), [transactions, country])
  const tier  = useMemo(() => scoreToTier(score), [score])

  const harvests = useMemo(() => transactions.filter(t => t.type === 'harvest'), [transactions])
  const sales    = useMemo(() => transactions.filter(t => t.type === 'sale'),    [transactions])
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense'), [transactions])

  const totalIncome  = useMemo(() => sales.reduce((s, t)    => s + t.value, 0), [sales])
  const totalExpense = useMemo(() => expenses.reduce((s, t) => s + t.value, 0), [expenses])

  const breakdown = useMemo(() => {
    const divisor = { Kenya:500, Uganda:18000, Ethiopia:30, Nigeria:700 }[country] ?? 500
    const freq    = Math.min(harvests.length * 25, 200)
    const cons    = Math.min(sales.length * 30, 200)
    const grow    = Math.min(Math.floor(totalIncome / divisor), 200)
    const reg     = Math.min(transactions.length * 10, 150)
    return { base:100, freq, cons, grow, reg }
  }, [harvests, sales, totalIncome, transactions, country])

  const harvestChartData = useMemo(() => {
    const months = {}
    harvests.forEach(h => {
      const m = new Date(h.date).toLocaleString('default', { month:'short', year:'2-digit' })
      months[m] = (months[m] || 0) + h.qty
    })
    return Object.entries(months).slice(-6).map(([month, kg]) => ({ month, kg }))
  }, [harvests])

  const incomeChartData = useMemo(() => {
    const months = {}
    sales.forEach(s => {
      const m = new Date(s.date).toLocaleString('default', { month:'short', year:'2-digit' })
      months[m] = (months[m] || 0) + s.value
    })
    return Object.entries(months).slice(-6).map(([month, value]) => ({ month, value }))
  }, [sales])

  const cropBreakdown = useMemo(() => {
    const crops = {}
    transactions.forEach(t => { crops[t.crop] = (crops[t.crop] || 0) + 1 })
    return Object.entries(crops).sort((a,b) => b[1]-a[1]).map(([crop,count]) => ({ crop, count }))
  }, [transactions])

  const streak = useMemo(() => Math.min(transactions.length * 3, 90), [transactions])

  return {
    score, tier, breakdown, currency,
    harvests, sales, expenses,
    totalIncome, totalExpense,
    harvestChartData, incomeChartData,
    cropBreakdown, streak,
    totalTransactions: transactions.length,
  }
}
