"use client";

import type { Participant, Expense, ExpenseSplit } from "@/lib/types";
import { calculateSettlements, calculateBalances } from "@/lib/settlement";

interface SettlementPanelProps {
  participants: Participant[];
  expenses: Expense[];
  expenseSplits: ExpenseSplit[];
}

/**
 * Panel que muestra las liquidaciones necesarias y los balances individuales.
 */
export default function SettlementPanel({
  participants,
  expenses,
  expenseSplits,
}: SettlementPanelProps) {
  const settlements = calculateSettlements(participants, expenses, expenseSplits);
  const balances = calculateBalances(participants, expenses, expenseSplits);

  const getName = (id: string): string => {
    return participants.find((p) => p.id === id)?.name ?? "Desconocido";
  };

  const formatAmount = (amount: number): string => {
    return `S/ ${Math.abs(amount).toFixed(2)}`;
  };

  // Total gastado
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-300 mb-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </div>
        <p className="text-gray-700 text-base font-semibold">
          Nada que resumir aun
        </p>
        <p className="text-gray-400 text-sm mt-1.5 max-w-[250px] mx-auto">
          Agrega gastos para ver quien le debe a quien.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Total gastado */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 shadow-md shadow-indigo-200/40">
        <p className="text-indigo-100 text-xs font-medium uppercase tracking-wide">
          Total gastado
        </p>
        <p className="text-white text-2xl font-bold mt-0.5">
          S/ {totalSpent.toFixed(2)}
        </p>
        <p className="text-indigo-200 text-xs mt-1">
          {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"} entre {participants.length} personas
        </p>
      </div>

      {/* Seccion de liquidaciones */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            Resumen de deudas
          </h3>
        </div>

        <div className="p-4">
          {settlements.length === 0 ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-semibold text-green-700">
                Todos estan al dia!
              </p>
              <p className="text-xs text-gray-400 mt-1">
                No hay deudas pendientes entre los participantes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 sm:gap-3 rounded-xl bg-gray-50 px-3 sm:px-4 py-3 animate-slide-up"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
                >
                  {/* Deudor */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold" aria-hidden="true">
                      {getName(settlement.from).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {getName(settlement.from)}
                    </span>
                  </div>

                  {/* Flecha y monto */}
                  <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span className="text-xs sm:text-sm font-bold text-indigo-600 whitespace-nowrap">
                      {formatAmount(settlement.amount)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>

                  {/* Acreedor */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate text-right">
                      {getName(settlement.to)}
                    </span>
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold" aria-hidden="true">
                      {getName(settlement.to).charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seccion de balances individuales */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            Balances individuales
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {participants.map((participant) => {
            const bal = balances[participant.id];
            if (!bal) return null;

            const isPositive = bal.balance > 0;
            const isZero = Math.abs(bal.balance) < 0.01;

            return (
              <div
                key={participant.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                      isZero
                        ? "bg-gray-100 text-gray-500"
                        : isPositive
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                    aria-hidden="true"
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-400">
                      Pagó {formatAmount(bal.paid)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-bold whitespace-nowrap ml-2 ${
                    isZero
                      ? "text-gray-400"
                      : isPositive
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {isZero
                    ? "S/ 0.00"
                    : isPositive
                    ? `+${formatAmount(bal.balance)}`
                    : `-${formatAmount(bal.balance)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
