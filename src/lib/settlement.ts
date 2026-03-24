import { Participant, Expense, ExpenseSplit, Settlement } from "./types";

/**
 * Calcula las liquidaciones necesarias para equilibrar los gastos entre participantes.
 *
 * Algoritmo:
 * 1. Por cada gasto, calcular cuánto debe cada participante (monto / cantidad de splits).
 * 2. Calcular balance neto: total_pagado - total_adeudado.
 * 3. Separar en acreedores (balance positivo) y deudores (balance negativo).
 * 4. Algoritmo voraz: emparejar el mayor deudor con el mayor acreedor, transferir el mínimo.
 * 5. Repetir hasta equilibrar.
 */
export function calculateSettlements(
  participants: Participant[],
  expenses: Expense[],
  expenseSplits: ExpenseSplit[]
): Settlement[] {
  if (expenses.length === 0 || participants.length === 0) {
    return [];
  }

  // Inicializar balances en 0
  const balances: Record<string, number> = {};
  for (const p of participants) {
    balances[p.id] = 0;
  }

  // Procesar cada gasto
  for (const expense of expenses) {
    // Encontrar los splits de este gasto
    const splits = expenseSplits.filter((s) => s.expense_id === expense.id);
    if (splits.length === 0) continue;

    // Cuánto debe cada participante en este gasto
    const perPerson = expense.amount / splits.length;

    // Distribuir centavos residuales al primer participante
    const roundedPerPerson = Math.floor(perPerson * 100) / 100;
    const remainder =
      Math.round((expense.amount - roundedPerPerson * splits.length) * 100) /
      100;

    splits.forEach((split, index) => {
      const owes = index === 0 ? roundedPerPerson + remainder : roundedPerPerson;
      // El participante debe esta cantidad
      if (balances[split.participant_id] !== undefined) {
        balances[split.participant_id] -= owes;
      }
    });

    // El que pagó recibe crédito por el monto total
    if (balances[expense.paid_by] !== undefined) {
      balances[expense.paid_by] += expense.amount;
    }
  }

  // Separar en acreedores y deudores
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ id, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ id, amount: Math.abs(rounded) });
    }
  }

  // Ordenar: mayor primero
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Algoritmo voraz
  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    const roundedTransfer = Math.round(transfer * 100) / 100;

    if (roundedTransfer > 0) {
      settlements.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: roundedTransfer,
      });
    }

    creditors[ci].amount -= roundedTransfer;
    debtors[di].amount -= roundedTransfer;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return settlements;
}

/**
 * Calcula el balance individual de cada participante.
 * Retorna un mapa de participantId -> { paid, owes, balance }
 */
export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  expenseSplits: ExpenseSplit[]
): Record<string, { paid: number; owes: number; balance: number }> {
  const result: Record<string, { paid: number; owes: number; balance: number }> =
    {};

  for (const p of participants) {
    result[p.id] = { paid: 0, owes: 0, balance: 0 };
  }

  for (const expense of expenses) {
    // Sumar lo que pagó
    if (result[expense.paid_by]) {
      result[expense.paid_by].paid += expense.amount;
    }

    // Calcular lo que debe cada participante
    const splits = expenseSplits.filter((s) => s.expense_id === expense.id);
    if (splits.length === 0) continue;

    const perPerson = expense.amount / splits.length;
    const roundedPerPerson = Math.floor(perPerson * 100) / 100;
    const remainder =
      Math.round((expense.amount - roundedPerPerson * splits.length) * 100) /
      100;

    splits.forEach((split, index) => {
      const owes = index === 0 ? roundedPerPerson + remainder : roundedPerPerson;
      if (result[split.participant_id]) {
        result[split.participant_id].owes += owes;
      }
    });
  }

  // Calcular balance neto
  for (const id of Object.keys(result)) {
    result[id].paid = Math.round(result[id].paid * 100) / 100;
    result[id].owes = Math.round(result[id].owes * 100) / 100;
    result[id].balance = Math.round((result[id].paid - result[id].owes) * 100) / 100;
  }

  return result;
}
