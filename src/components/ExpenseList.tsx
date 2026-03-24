"use client";

import type { Expense, ExpenseSplit, Participant } from "@/lib/types";

interface ExpenseListProps {
  expenses: Expense[];
  expenseSplits: ExpenseSplit[];
  participants: Participant[];
}

/**
 * Lista de gastos de la sala.
 * Muestra cada gasto con descripcion, monto, quien pago y quienes participan.
 */
export default function ExpenseList({
  expenses,
  expenseSplits,
  participants,
}: ExpenseListProps) {
  const getParticipantName = (id: string): string => {
    return participants.find((p) => p.id === id)?.name ?? "Desconocido";
  };

  const getSplitParticipants = (expenseId: string): string[] => {
    return expenseSplits
      .filter((s) => s.expense_id === expenseId)
      .map((s) => getParticipantName(s.participant_id));
  };

  const formatAmount = (amount: number): string => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return "Ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours}h`;

      return date.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-400 mb-5">
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
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <p className="text-gray-700 text-base font-semibold">
          Sin gastos todavia
        </p>
        <p className="text-gray-400 text-sm mt-1.5 max-w-[250px] mx-auto">
          Agrega el primer gasto tocando el boton de abajo para comenzar a dividir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => {
        const splitNames = getSplitParticipants(expense.id);
        const payerName = getParticipantName(expense.paid_by);
        const perPerson = splitNames.length > 0 ? expense.amount / splitNames.length : 0;

        return (
          <div
            key={expense.id}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {expense.description}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500">
                    Pago{" "}
                    <span className="font-medium text-indigo-600">
                      {payerName}
                    </span>
                  </p>
                  {expense.created_at && (
                    <span className="text-[10px] text-gray-300">
                      {formatDate(expense.created_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-base font-bold text-gray-900">
                  {formatAmount(expense.amount)}
                </span>
                {splitNames.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatAmount(perPerson)} c/u
                  </p>
                )}
              </div>
            </div>

            {splitNames.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5">
                  Dividido entre {splitNames.length}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {splitNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
