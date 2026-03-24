"use client";

import { useState, useEffect, useRef } from "react";
import type { Participant } from "@/lib/types";

interface AddExpenseModalProps {
  participants: Participant[];
  currentParticipantId?: string | null;
  onSubmit: (
    description: string,
    amount: number,
    paidBy: string,
    splitParticipantIds: string[]
  ) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal para agregar un nuevo gasto.
 * Incluye campos para descripcion, monto, quien pago y entre quienes se divide.
 * En mobile se muestra como bottom sheet, en desktop como modal centrado.
 */
export default function AddExpenseModal({
  participants,
  currentParticipantId,
  onSubmit,
  onClose,
}: AddExpenseModalProps) {
  // Default paid_by to the current participant if available
  const defaultPaidBy = currentParticipantId
    ? participants.find((p) => p.id === currentParticipantId)?.id ?? participants[0]?.id ?? ""
    : participants[0]?.id ?? "";

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(defaultPaidBy);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(participants.map((p) => p.id))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Auto-focus description input
  useEffect(() => {
    // Small delay to let animation start
    const timer = setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError("La descripcion es obligatoria.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Ingresa un monto valido mayor a 0.");
      return;
    }

    if (!paidBy) {
      setError("Selecciona quien pago.");
      return;
    }

    if (selectedParticipants.size === 0) {
      setError("Selecciona al menos un participante.");
      return;
    }

    if (!selectedParticipants.has(paidBy)) {
      setError("La persona que pago debe estar entre los participantes.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(
        trimmedDesc,
        Math.round(numAmount * 100) / 100,
        paidBy,
        Array.from(selectedParticipants)
      );
      onClose();
    } catch {
      setError("Error al guardar el gasto. Verifica tu conexion e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4 animate-backdrop-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-modal-slide-up sm:animate-modal-scale-in">
        {/* Encabezado */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          {/* Indicador de arrastre en mobile */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 sm:hidden" />
          <h2 id="add-expense-title" className="text-lg font-bold text-gray-900">
            Nuevo gasto
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Descripcion */}
          <div>
            <label
              htmlFor="expenseDescription"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Descripcion
            </label>
            <input
              ref={descriptionInputRef}
              id="expenseDescription"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej: Almuerzo, Taxi, Entradas"
              maxLength={100}
              autoComplete="off"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Monto */}
          <div>
            <label
              htmlFor="expenseAmount"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Monto (S/)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                S/
              </span>
              <input
                id="expenseAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Quien pago */}
          <div>
            <label
              htmlFor="expensePaidBy"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Quien pago?
            </label>
            <div className="relative">
              <select
                id="expensePaidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all appearance-none"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Participantes en el gasto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entre quienes se divide?
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {participants.map((p) => {
                const isChecked = selectedParticipants.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 cursor-pointer transition-all ${
                      isChecked
                        ? "border-indigo-300 bg-indigo-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleParticipant(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20"
                      aria-label={`Incluir a ${p.name}`}
                    />
                    <span className="text-sm text-gray-900">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Resumen */}
          {selectedParticipants.size > 0 && amount && parseFloat(amount) > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl px-4 py-3 animate-fade-in">
              <p className="text-sm text-indigo-700">
                Cada uno paga{" "}
                <span className="font-bold">
                  S/ {(parseFloat(amount) / selectedParticipants.size).toFixed(2)}
                </span>
                {" "}({selectedParticipants.size}{" "}
                {selectedParticipants.size === 1 ? "persona" : "personas"})
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-slide-down"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Boton enviar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200/50 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Guardando...
              </span>
            ) : (
              "Agregar gasto"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
