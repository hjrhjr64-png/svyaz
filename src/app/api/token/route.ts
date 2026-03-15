import { NextRequest, NextResponse } from "next/server";
import { generateToken, getRoomServiceClient } from "@/lib/livekit";
import { ROOM_TTL_HOURS, UI_TEXT } from "@/lib/utils";

/**
 * POST /api/token
 * Генерирует LiveKit JWT-токен для подключения к комнате.
 * Включает проверку безопасности (время жизни комнаты).
 */
export async function POST(request: NextRequest) {
  try {
    const { roomId, participantName } = await request.json();

    if (!roomId || !participantName) {
      return NextResponse.json(
        { error: "roomId и participantName обязательны" },
        { status: 400 }
      );
    }
    // 1. Проверка существования и возраста комнаты
    try {
      const roomService = getRoomServiceClient();
      const rooms = await roomService.listRooms([roomId]);
      
      if (rooms.length > 0) {
        const room = rooms[0];
        const creationTime = Number(room.creationTime);
        const now = Math.floor(Date.now() / 1000);
        const ageInHours = (now - creationTime) / 3600;

        if (ageInHours > ROOM_TTL_HOURS) {
          return NextResponse.json(
            { error: UI_TEXT.roomUnavailable },
            { status: 403 }
          );
        }
      }
    } catch (e) {
      console.warn("Room check failed:", e);
    }

    // 2. Ограничение длины имени
    const name = participantName.trim().slice(0, 30);
    if (name.length === 0) {
      return NextResponse.json(
        { error: "Имя не может быть пустым" },
        { status: 400 }
      );
    }

    const token = await generateToken(roomId, name);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Ошибка генерации токена:", error);
    return NextResponse.json(
      { error: UI_TEXT.connectError },
      { status: 500 }
    );
  }
}
