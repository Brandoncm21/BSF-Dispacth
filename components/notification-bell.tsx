"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getNotifications, getUnreadCount, markRead, markAllRead } from "@/lib/actions";
import { cn } from "@/lib/utils";

type Notification = {
  notification_id: number;
  type: string;
  title: string;
  message: string | null;
  load_id: number;
  is_read: boolean;
  created_at: string;
  data: Record<string, unknown> | null;
};

type Props = {
  recipientType: "dispatcher" | "driver" | "broker";
  recipientId: number;
};

export function NotificationBell({ recipientType, recipientId }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = useRef(createSupabaseBrowserClient());

  const fetchData = useCallback(async () => {
    if (!recipientId) return;
    const [list, count] = await Promise.all([
      getNotifications(recipientType, recipientId, 10),
      getUnreadCount(recipientType, recipientId),
    ]);
    setNotifications(list);
    setUnread(count);
    setLoading(false);
  }, [recipientType, recipientId]);

  useEffect(() => {
    fetchData();

    if (!recipientId) return;
    const channel = supabase.current
      .channel(`notifications:${recipientType}:${recipientId}`)
      .on("broadcast", { event: "new_notification" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [recipientType, recipientId, fetchData]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = async (id: number) => {
    await markRead(id);
    fetchData();
  };

  const handleMarkAllRead = async () => {
    await markAllRead(recipientType, recipientId);
    fetchData();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "ahora";
    if (min < 60) return `hace ${min} min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        {unread > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">
                Sin notificaciones
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.notification_id}
                  type="button"
                  onClick={() => handleMarkRead(n.notification_id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors",
                    !n.is_read && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <div className={cn("flex-1 min-w-0", n.is_read && "ml-4")}>
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
