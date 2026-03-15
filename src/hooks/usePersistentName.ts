"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "user_display_name";

/**
 * Хук для работы с сохраненным именем пользователя.
 * Хранит данные только локально в браузере.
 */
export function usePersistentName() {
  const [name, setNameState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка при монтировании
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(STORAGE_KEY);
      if (savedName) {
        setNameState(savedName);
      }
    } catch (e) {
      console.warn("LocalStorage access inhibited:", e);
    }
    setIsLoaded(true);
  }, []);

  // Сохранение имени
  const persistName = useCallback((newName: string) => {
    const trimmed = newName.trim();
    setNameState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
        // Также обновляем старый ключ для совместимости (если был)
        localStorage.setItem("user-name", trimmed);
      }
    } catch (e) {
      console.warn("Failed to persist name:", e);
    }
  }, []);

  // Очистка имени
  const clearName = useCallback(() => {
    setNameState("");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("user-name");
    } catch (e) {
      console.warn("Failed to clear name:", e);
    }
  }, []);

  return {
    name,
    persistName,
    clearName,
    isLoaded,
    hasSavedName: !!name && isLoaded,
  };
}
