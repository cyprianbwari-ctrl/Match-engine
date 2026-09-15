import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const FinanceCtx = createContext(null);

// Seed history so the ledger isn't empty on a fresh save — everything added
// after this comes from real game events (transfers, matchday results).
const SEED_TRANSACTIONS = [
  { id: 'seed-1', date: '14 Dec 2025', label: 'Matchday vs Aston Villa', category: 'Matchday Revenue', amount: 3_200_000, status: 'Completed' },
  { id: 'seed-2', date: '12 Dec 2025', label: 'Adidas Sponsorship Payment', category: 'Sponsorships', amount: 1_200_000, status: 'Completed' },
  { id: 'seed-3', date: '10 Dec 2025', label: 'TV Rights Payment', category: 'Broadcasting Rights', amount: 4_800_000, status: 'Completed' },
  { id: 'seed-4', date: '08 Dec 2025', label: 'Player Wages (December)', category: 'Player Wages', amount: -2_480_000, status: 'Completed' },
  { id: 'seed-5', date: '06 Dec 2025', label: 'Facility Upgrade', category: 'Facilities & Stadium', amount: -2_100_000, status: 'Completed' },
];

export function FinanceProvider({ children }) {
  const [balance, setBalance] = useState(142_560_000);
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);

  // The one place the balance is ever allowed to change — every meaningful
  // financial event in the game routes through here rather than any screen
  // editing a number directly.
  const addTransaction = useCallback((label, amount, category, meta = {}) => {
    setBalance(b => b + amount);
    setTransactions(ts => [
      { id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date: 'Today', label, category, amount, status: 'Completed', ...meta },
      ...ts,
    ].slice(0, 200));
  }, []);

  const totalIncome = useMemo(() => transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0), [transactions]);
  const netProfit = totalIncome - totalExpenses;
  const financialStatus = balance > 120_000_000 ? 'Healthy' : balance > 40_000_000 ? 'Caution' : 'Concerning';
  const statusColor = financialStatus === 'Healthy' ? '#3ddc84' : financialStatus === 'Caution' ? '#f2c94c' : '#ef4f4f';

  const value = useMemo(() => ({
    balance, transactions, addTransaction, totalIncome, totalExpenses, netProfit, financialStatus, statusColor,
    getSnapshot: () => ({ balance, transactions }),
    restoreSnapshot: (s) => {
      if (!s) return;
      if (s.balance !== undefined) setBalance(s.balance);
      if (s.transactions) setTransactions(s.transactions);
    },
  }), [balance, transactions, addTransaction, totalIncome, totalExpenses, netProfit, financialStatus, statusColor]);

  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>;
}

export function useFinanceData() {
  const ctx = useContext(FinanceCtx);
  if (!ctx) throw new Error('useFinanceData must be used within a FinanceProvider');
  return ctx;
}
