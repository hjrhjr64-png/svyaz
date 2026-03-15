import { NextResponse } from "next/server";
import { generateRoomId } from "@/lib/utils";

/**
 * POST /api/room
 * Создаёт новую комнату и возвращает её ID.
 */
export async function POST() {
  try {
    const roomId = generateRoomId();

    return NextResponse.json({ roomId }, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания комнаты:", error);
    return NextResponse.json(
      { error: "Не удалось создать комнату" },
      { status: 500 }
    );
  }
}
