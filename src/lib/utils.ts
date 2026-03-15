import { nanoid } from "nanoid";

/**
 * Генерирует уникальный ID комнаты (21 символ, URL-safe).
 * Длина увеличена до 21 для максимальной безопасности (криптостойкость).
 */
export function generateRoomId(): string {
  return nanoid(21);
}

/**
 * Время жизни комнаты в часах (24 часа).
 * После этого ссылка считается недействительной.
 */
export const ROOM_TTL_HOURS = 24;

/**
 * Максимальное количество участников в комнате.
 */
export const MAX_PARTICIPANTS = 6;
export const MAX_NAME_LENGTH = 30;

/**
 * Системные тексты интерфейса (русский).
 */
export const UI_TEXT = {
  // Главная
  appName: "Связь",
  appTagline: "Чтобы просто быть на связи",
  createRoom: "Создать встречу",
  joinRoom: "Присоединиться",
  joinRoomPlaceholder: "Вставьте ссылку или код комнаты",

  // Общие кнопки
  retry: "Повторить",
  cancel: "Отмена",
  backToHome: "На главную",
  continueWithoutVideo: "Продолжить без видео",
  invite: "Пригласить",
  complete: "Завершить",

  // Комната
  enterName: "Как вас зовут?",
  checkName: "Проверьте имя",
  nameDescription: "Оно будет видно другим участникам",
  namePlaceholder: "Ваше имя",
  joinCall: "Войти в звонок",
  notMe: "Это не я",
  nameTooLong: "Имя слишком длинное",
  waitingForOthers: "Ожидаем подключения…",
  you: "Вы",

  // Управление
  micOn: "Микрофон включён",
  micOff: "Микрофон выключен",
  cameraOn: "Камера включена",
  cameraOff: "Камера выключена",
  screenShareStart: "Показать экран",
  screenShareStop: "Остановить показ",
  endCall: "Завершить",
  copyLink: "Скопировать ссылку",
  linkCopied: "Ссылка скопирована",

  // Предпросмотр
  preJoinTitle: "Готовы присоединиться?",
  preJoinSubtitle: "Проверьте камеру и микрофон перед входом",
  nameLabel: "Ваше имя",

  // Системные статусы (Информационные)
  connecting: "Подключаем звонок",
  connectingSubtitle: "Это может занять несколько секунд",
  checkingDevices: "Проверяем камеру и микрофон",
  waitingSubtitle: "Отправьте ссылку другому участнику",
  connectionRestored: "Соединение восстановлено",

  // Предупреждения
  connectionSlow: "Слабое соединение",
  connectionSlowSubtitle: "Качество видео может временно снизиться",
  connectionOptimizing: "Пробуем сохранить стабильный звонок",
  onlyYou: "Вы остались в звонке один",
  onlyYouSubtitle: "Можно подождать или завершить звонок",

  // Ошибки доступа
  noMicAccess: "Нет доступа к микрофону",
  noMicAccessSubtitle: "Разрешите доступ в настройках браузера",
  noCameraAccess: "Нет доступа к камере",
  noCameraAccessSubtitle: "Разрешите доступ в настройках браузера",
  
  // Ошибки подключения
  connectError: "Не удалось подключиться",
  connectErrorSubtitle: "Проверьте интернет и попробуйте снова",
  reconnecting: "Восстанавливаем соединение",
  reconnectingSubtitle: "Подождите немного",
  roomFull: "Комната заполнена",
  roomUnavailable: "Комната недоступна",
  roomUnavailableSubtitle: "Создайте новый звонок или попросите новую ссылку",

  // Финал
  callFinished: "Звонок завершён",
  callFinishedSubtitle: "Вы можете создать новый звонок",

  // Окно приглашения
  shareTitle: "Чтобы пригласить других участников, отправьте им ссылку на встречу",
  shareLinkCopied: "Ссылка уже скопирована",
  shareMeetingNumber: "Встреча №",

  // Режим участника
  pin: "Закрепить",
  unpin: "Снять закрепление",

  // PWA & Offline
  offlineTitle: "Нет подключения к интернету",
  offlineSubtitle: "Проверьте сеть и попробуйте снова",
  offlineCallWarning: "Для звонка нужен интернет",
  installTitle: "Добавить на экран",
  installSubtitle: "Так приложение будет открываться быстрее",
  installAdd: "Добавить",
  installNotNow: "Не сейчас",
  installIosStep1: "Нажмите «Поделиться»",
  installIosStep2: "Выберите «На экран Домой»",
} as const;
