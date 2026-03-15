import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { MAX_PARTICIPANTS } from "./utils";

/**
 * Генерирует LiveKit JWT-токен для участника.
 *
 * @param roomName — ID комнаты
 * @param participantName — имя участника (отображается в UI)
 * @returns JWT-токен для подключения к LiveKit
 */
export async function generateToken(
  roomName: string,
  participantName: string
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error("Environment check: LIVEKIT_API_KEY or SECRET is missing.");
    throw new Error(
      "LIVEKIT_API_KEY и LIVEKIT_API_SECRET не настроены в .env.local"
    );
  }
  console.log(`LiveKit credentials located. Key: ${apiKey.slice(0, 4)}...`);

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const jwt = await token.toJwt();
  return jwt;
}

/**
 * Возвращает клиент для управления комнатами на сервере.
 */
export function getRoomServiceClient() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error("LiveKit credentials not configured");
  }

  // RoomServiceClient expects http/https URL
  const httpUrl = url.replace(/^ws/, "http");
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
}
