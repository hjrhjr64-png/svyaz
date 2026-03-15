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
    // 1. Проверка существования и возраста комнаты (также проверяем валидность ключей)
    try {
      const roomService = getRoomServiceClient();
      const rooms = await roomService.listRooms([roomId]);
      console.log(`Room check success. Found ${rooms.length} rooms.`);
      
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
    } catch (e: any) {
      console.error("Critical: Room check/Auth failed:", e.message);
      // Если это ошибка авторизации (invalid API key/secret), прокидываем её наружу
      return NextResponse.json(
        { error: `Ошибка авторизации сервера: ${e.message}` },
        { status: 401 }
      );
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
