"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRoom } from "@/hooks/useRoom";
import { useIdentity } from "@/hooks/useIdentity";
import JoinRoomDialog from "@/components/JoinRoomDialog";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseModal from "@/components/AddExpenseModal";
import SettlementPanel from "@/components/SettlementPanel";
import type { Participant } from "@/lib/types";

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { code } = use(params);
  const roomCode = code.toUpperCase();

  const {
    room,
    participants,
    expenses,
    expenseSplits,
    loading,
    error,
    addExpense,
    addParticipant,
  } = useRoom(roomCode);

  const {
    participantId,
    participantName,
    isIdentified,
    setIdentity,
  } = useIdentity(roomCode);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"gastos" | "resumen">("gastos");

  // Resolver el nombre del participante si solo tenemos el ID (formato viejo de localStorage)
  useEffect(() => {
    if (
      isIdentified &&
      participantId &&
      !participantName &&
      participants.length > 0
    ) {
      const found = participants.find((p) => p.id === participantId);
      if (found) {
        setIdentity(found.id, found.name);
      }
    }
  }, [isIdentified, participantId, participantName, participants, setIdentity]);

  // Seleccionar participante existente
  const handleSelectExisting = useCallback(
    (participant: Participant) => {
      setIdentity(participant.id, participant.name);
    },
    [setIdentity]
  );

  // Crear nuevo participante y seleccionarlo
  const handleCreateNew = useCallback(
    async (name: string) => {
      setJoinLoading(true);
      try {
        const newParticipant = await addParticipant(name);
        if (newParticipant) {
          setIdentity(newParticipant.id, newParticipant.name);
        }
      } catch {
        // Error manejado por useRoom
      } finally {
        setJoinLoading(false);
      }
    },
    [addParticipant, setIdentity]
  );

  // Compartir enlace - usa Web Share API si esta disponible, sino copia al portapapeles
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/sala/${roomCode}`;

    // Intentar Web Share API primero (disponible en moviles)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Dividir Gastos",
          text: `Unite a la sala ${roomCode} para dividir gastos`,
          url,
        });
        return;
      } catch (err) {
        // Si el usuario cancelo el share dialog, no hacer nada
        if (err instanceof Error && err.name === "AbortError") return;
        // Si no se pudo usar share, seguir con el fallback de copiar
      }
    }

    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomCode]);

  // Estado de carga
  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Cargando sala...</p>
        </div>
      </div>
    );
  }

  // Error: sala no encontrada
  if (error || !room) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-4">
        <div className="text-center animate-fade-in max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Sala no encontrada
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || "El codigo de sala no existe o fue eliminado."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }

  // Mostrar dialogo de identificacion si el usuario no esta identificado
  if (!isIdentified) {
    return (
      <div className="flex flex-col flex-1">
        <JoinRoomDialog
          participants={participants}
          onSelectExisting={handleSelectExisting}
          onCreateNew={handleCreateNew}
          isLoading={joinLoading}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Sala {roomCode}
              </h1>
              <button
                onClick={handleShare}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                  copied
                    ? "bg-green-100 text-green-700 animate-pulse-once"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95"
                }`}
                aria-label={copied ? "Enlace copiado" : "Compartir enlace de la sala"}
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="hidden xs:inline">Copiado!</span>
                    <span className="xs:hidden">OK</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Compartir
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Hola, <span className="font-medium text-indigo-600">{participantName}</span> · {participants.length}{" "}
              {participants.length === 1 ? "participante" : "participantes"}
            </p>
          </div>

          <a
            href="/"
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Ir al inicio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </a>
        </div>
      </header>

      {/* Participantes */}
      <div className="max-w-lg mx-auto w-full px-3 sm:px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {participants.map((p) => (
            <div
              key={p.id}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-medium border transition-colors ${
                p.id === participantId
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  p.id === participantId
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                aria-hidden="true"
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[80px] truncate">{p.name}</span>
              {p.id === participantId && (
                <span className="text-[10px] text-indigo-500">(tu)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto w-full px-3 sm:px-4 pt-3">
        <div className="flex rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Secciones de la sala">
          <button
            onClick={() => setActiveTab("gastos")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === "gastos"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            role="tab"
            aria-selected={activeTab === "gastos"}
            aria-controls="tab-gastos"
          >
            Gastos ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab("resumen")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === "resumen"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            role="tab"
            aria-selected={activeTab === "resumen"}
            aria-controls="tab-resumen"
          >
            Resumen
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-lg mx-auto w-full px-3 sm:px-4 py-4 flex-1">
        <div id="tab-gastos" role="tabpanel" className={activeTab === "gastos" ? "animate-fade-in" : "hidden"}>
          <ExpenseList
            expenses={expenses}
            expenseSplits={expenseSplits}
            participants={participants}
          />
        </div>
        <div id="tab-resumen" role="tabpanel" className={activeTab === "resumen" ? "animate-fade-in" : "hidden"}>
          <SettlementPanel
            participants={participants}
            expenses={expenses}
            expenseSplits={expenseSplits}
          />
        </div>
      </div>

      {/* Boton flotante para agregar gasto */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-4 pb-6 px-3 sm:px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowAddExpense(true)}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-300/40 hover:shadow-indigo-400/50 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            aria-label="Agregar un nuevo gasto"
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
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Agregar gasto
          </button>
        </div>
      </div>

      {/* Modal para agregar gasto */}
      {showAddExpense && (
        <AddExpenseModal
          participants={participants}
          currentParticipantId={participantId}
          onSubmit={addExpense}
          onClose={() => setShowAddExpense(false)}
        />
      )}
    </div>
  );
}
