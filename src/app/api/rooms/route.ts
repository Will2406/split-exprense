import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/room-code";

interface CreateRoomBody {
  creatorName: string;
  friendNames: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomBody = await request.json();

    // Validate creator name
    if (
      !body.creatorName ||
      typeof body.creatorName !== "string" ||
      body.creatorName.trim().length === 0 ||
      body.creatorName.trim().length > 50
    ) {
      return NextResponse.json(
        { error: "El nombre del creador es requerido (máximo 50 caracteres)." },
        { status: 400 }
      );
    }

    // Validate friend names
    const friendNames = Array.isArray(body.friendNames) ? body.friendNames : [];
    if (friendNames.length > 20) {
      return NextResponse.json(
        { error: "Se permiten máximo 20 amigos." },
        { status: 400 }
      );
    }

    // Filter out empty friend names and validate length
    const validFriendNames = friendNames
      .map((name) => (typeof name === "string" ? name.trim() : ""))
      .filter((name) => name.length > 0 && name.length <= 50);

    const creatorName = body.creatorName.trim();

    // Try to create the room with a unique code, retry up to 3 times on collision
    const MAX_RETRIES = 3;
    let roomId: string | null = null;
    let roomCode: string | null = null;

    const supabase = getSupabase();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = generateRoomCode();

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({ code })
        .select("id, code")
        .single();

      if (roomError) {
        // Check if it's a unique constraint violation (code collision)
        if (roomError.code === "23505") {
          // Retry with a new code
          continue;
        }
        return NextResponse.json(
          { error: "Error al crear la sala." },
          { status: 500 }
        );
      }

      roomId = room.id;
      roomCode = room.code;
      break;
    }

    if (!roomId || !roomCode) {
      return NextResponse.json(
        { error: "No se pudo generar un código único. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // Insert all participants (creator + friends)
    const allNames = [creatorName, ...validFriendNames];
    const participantRows = allNames.map((name) => ({
      room_id: roomId,
      name,
    }));

    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .insert(participantRows)
      .select("id, name");

    if (participantsError) {
      return NextResponse.json(
        { error: "Error al agregar participantes." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        code: roomCode,
        roomId,
        participants,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }
}
