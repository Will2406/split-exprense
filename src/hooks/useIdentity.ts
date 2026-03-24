"use client";

import { useState, useCallback, useEffect } from "react";

interface Identity {
  participantId: string;
  participantName: string;
}

interface UseIdentityReturn {
  participantId: string | null;
  participantName: string | null;
  isIdentified: boolean;
  setIdentity: (participantId: string, participantName: string) => void;
  clearIdentity: () => void;
}

function getStorageKey(roomCode: string): string {
  return `room_identity_${roomCode}`;
}

/**
 * Hook para gestionar la identidad del usuario por sala.
 * Persiste en localStorage con la clave `room_identity_{roomCode}`.
 * Compatible con la identidad guardada en CreateRoomForm.
 */
export function useIdentity(roomCode: string): UseIdentityReturn {
  const [identity, setIdentityState] = useState<Identity | null>(null);

  // Cargar identidad desde localStorage al montar
  useEffect(() => {
    if (!roomCode) return;

    const key = getStorageKey(roomCode);

    // Primero intentar leer el formato nuevo (JSON con id + name)
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.participantId && parsed.participantName) {
          setIdentityState(parsed);
          return;
        }
      } catch {
        // Puede ser el formato anterior (solo el ID como string plano)
        // guardado por CreateRoomForm
        if (typeof stored === "string" && stored.length > 0) {
          // Es un UUID plano del formato viejo — lo guardamos solo con ID
          // El nombre se resolverá cuando se carguen los participantes
          setIdentityState({ participantId: stored, participantName: "" });
          return;
        }
      }
    }

    setIdentityState(null);
  }, [roomCode]);

  const setIdentity = useCallback(
    (participantId: string, participantName: string) => {
      const key = getStorageKey(roomCode);
      const data: Identity = { participantId, participantName };
      localStorage.setItem(key, JSON.stringify(data));
      setIdentityState(data);
    },
    [roomCode]
  );

  const clearIdentity = useCallback(() => {
    const key = getStorageKey(roomCode);
    localStorage.removeItem(key);
    setIdentityState(null);
  }, [roomCode]);

  return {
    participantId: identity?.participantId ?? null,
    participantName: identity?.participantName ?? null,
    isIdentified: identity !== null && identity.participantId.length > 0,
    setIdentity,
    clearIdentity,
  };
}
