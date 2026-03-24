"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import type {
  Room,
  Participant,
  Expense,
  ExpenseSplit,
} from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRoomReturn {
  room: Room | null;
  participants: Participant[];
  expenses: Expense[];
  expenseSplits: ExpenseSplit[];
  loading: boolean;
  error: string | null;
  addExpense: (
    description: string,
    amount: number,
    paidBy: string,
    splitParticipantIds: string[]
  ) => Promise<void>;
  addParticipant: (name: string) => Promise<Participant | null>;
}

/**
 * Hook principal para gestionar el estado de una sala.
 * Carga datos iniciales y se suscribe a cambios en tiempo real via Supabase Realtime.
 */
export function useRoom(roomCode: string): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseSplits, setExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Función para cargar todos los datos de la sala
  const fetchRoomData = useCallback(async () => {
    try {
      const supabase = getSupabase();

      // 1. Obtener la sala por código
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .single();

      if (roomError || !roomData) {
        setError("Sala no encontrada.");
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // 2. Obtener participantes
      const { data: participantsData } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomData.id)
        .order("created_at", { ascending: true });

      setParticipants(participantsData ?? []);

      // 3. Obtener gastos
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("room_id", roomData.id)
        .order("created_at", { ascending: false });

      setExpenses(expensesData ?? []);

      // 4. Obtener splits de gastos
      if (expensesData && expensesData.length > 0) {
        const expenseIds = expensesData.map((e: Expense) => e.id);
        const { data: splitsData } = await supabase
          .from("expense_splits")
          .select("*")
          .in("expense_id", expenseIds);

        setExpenseSplits(splitsData ?? []);
      } else {
        setExpenseSplits([]);
      }

      setError(null);
    } catch {
      setError("Error al cargar los datos de la sala.");
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  // Cargar datos iniciales y suscribirse a tiempo real
  useEffect(() => {
    if (!roomCode) return;

    fetchRoomData();

    const supabase = getSupabase();

    // Crear canal de Realtime para la sala
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
        },
        (payload) => {
          const newParticipant = payload.new as Participant;
          // Solo agregar si pertenece a esta sala
          setRoom((currentRoom) => {
            if (currentRoom && newParticipant.room_id === currentRoom.id) {
              setParticipants((prev) => {
                // Evitar duplicados
                if (prev.some((p) => p.id === newParticipant.id)) return prev;
                return [...prev, newParticipant];
              });
            }
            return currentRoom;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expenses",
        },
        (payload) => {
          const newExpense = payload.new as Expense;
          setRoom((currentRoom) => {
            if (currentRoom && newExpense.room_id === currentRoom.id) {
              setExpenses((prev) => {
                if (prev.some((e) => e.id === newExpense.id)) return prev;
                return [newExpense, ...prev];
              });
            }
            return currentRoom;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expense_splits",
        },
        (payload) => {
          const newSplit = payload.new as ExpenseSplit;
          setExpenseSplits((prev) => {
            if (
              prev.some(
                (s) =>
                  s.expense_id === newSplit.expense_id &&
                  s.participant_id === newSplit.participant_id
              )
            )
              return prev;
            return [...prev, newSplit];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          // Re-fetch datos completos al reconectarse
          fetchRoomData();
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, fetchRoomData]);

  // Agregar un nuevo gasto con sus splits
  const addExpense = useCallback(
    async (
      description: string,
      amount: number,
      paidBy: string,
      splitParticipantIds: string[]
    ) => {
      if (!room) return;

      const supabase = getSupabase();

      // Insertar el gasto
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          room_id: room.id,
          description,
          amount,
          paid_by: paidBy,
        })
        .select()
        .single();

      if (expenseError || !expenseData) {
        throw new Error("Error al agregar el gasto.");
      }

      // Insertar los splits
      const splitRows = splitParticipantIds.map((participantId) => ({
        expense_id: expenseData.id,
        participant_id: participantId,
      }));

      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(splitRows);

      if (splitsError) {
        throw new Error("Error al dividir el gasto.");
      }
    },
    [room]
  );

  // Agregar un nuevo participante
  const addParticipant = useCallback(
    async (name: string): Promise<Participant | null> => {
      if (!room) return null;

      const supabase = getSupabase();

      const { data, error: insertError } = await supabase
        .from("participants")
        .insert({ room_id: room.id, name })
        .select()
        .single();

      if (insertError || !data) {
        throw new Error("Error al agregar participante.");
      }

      return data as Participant;
    },
    [room]
  );

  return {
    room,
    participants,
    expenses,
    expenseSplits,
    loading,
    error,
    addExpense,
    addParticipant,
  };
}
