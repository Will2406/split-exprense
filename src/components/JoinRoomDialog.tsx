"use client";

import { useState, useRef, useEffect } from "react";
import type { Participant } from "@/lib/types";

interface JoinRoomDialogProps {
  participants: Participant[];
  onSelectExisting: (participant: Participant) => void;
  onCreateNew: (name: string) => void;
  isLoading?: boolean;
}

/**
 * Dialogo de pantalla completa que se muestra cuando un usuario
 * abre la URL de una sala pero no esta identificado.
 * Permite elegir un participante existente o agregar uno nuevo.
 */
export default function JoinRoomDialog({
  participants,
  onSelectExisting,
  onCreateNew,
  isLoading = false,
}: JoinRoomDialogProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus el input cuando se muestra el formulario nuevo
  useEffect(() => {
    if (showNewForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNewForm]);

  // Trap focus dentro del dialogo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showNewForm) {
        setShowNewForm(false);
        setNewName("");
        setError(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showNewForm]);

  const handleCreateNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Ingresa tu nombre para continuar.");
      return;
    }
    if (trimmed.length > 50) {
      setError("El nombre no puede tener mas de 50 caracteres.");
      return;
    }
    setError(null);
    onCreateNew(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-backdrop-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-8 animate-modal-scale-in"
      >
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 id="join-dialog-title" className="text-xl font-bold text-gray-900">
            Quien eres?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona tu nombre para continuar o unite como alguien nuevo.
          </p>
        </div>

        {!showNewForm ? (
          <div className="animate-fade-in">
            {/* Lista de participantes existentes */}
            {participants.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Participantes en esta sala
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                  {participants.map((participant) => (
                    <button
                      key={participant.id}
                      onClick={() => onSelectExisting(participant)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold" aria-hidden="true">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {participant.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-indigo-600 flex-shrink-0 ml-2">
                        Soy yo
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Separador */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">o</span>
              </div>
            </div>

            {/* Boton para agregar nuevo participante */}
            <button
              onClick={() => setShowNewForm(true)}
              disabled={isLoading}
              className="w-full rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Soy alguien nuevo
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Formulario para nuevo participante */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="newParticipantName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Tu nombre
                </label>
                <input
                  ref={inputRef}
                  id="newParticipantName"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ej: Maria"
                  maxLength={50}
                  autoComplete="given-name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateNew();
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
                {error && (
                  <p className="mt-1.5 text-sm text-red-600 animate-slide-down" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewName("");
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Uniendo...
                    </span>
                  ) : (
                    "Unirme"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
