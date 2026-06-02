"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type NotificationEvent = {
  id: number;
  type: string;
  title: string;
  message?: string;
  load_id: number;
};

type NotificationContextType = {
  lastEvent: NotificationEvent | null;
};

const NotificationContext = createContext<NotificationContextType>({ lastEvent: null });

export function useNotificationEvent() {
  return useContext(NotificationContext);
}

type Props = {
  recipientType: "dispatcher" | "driver" | "broker";
  recipientId: number;
  children: ReactNode;
};

export function NotificationProvider({ recipientType, recipientId, children }: Props) {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);
  const supabase = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    if (!recipientId) return;

    const channel = supabase.current
      .channel(`notifications:${recipientType}:${recipientId}`)
      .on("broadcast", { event: "new_notification" }, (payload: { payload: NotificationEvent }) => {
        setLastEvent(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [recipientType, recipientId]);

  return (
    <NotificationContext.Provider value={{ lastEvent }}>
      {children}
    </NotificationContext.Provider>
  );
}
