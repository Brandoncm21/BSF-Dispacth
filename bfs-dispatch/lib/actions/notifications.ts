"use server";

import { getSupabaseServerClient } from "./core";

type CreateNotificationParams = {
  recipient_type: "dispatcher" | "driver" | "broker";
  recipient_id: number;
  load_id: number;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
};

export async function createNotification(params: CreateNotificationParams) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_type: params.recipient_type,
      recipient_id: params.recipient_id,
      load_id: params.load_id,
      type: params.type,
      title: params.title,
      message: params.message || null,
      data: params.data || null,
      sent_via: "in_app",
      status: "sent",
    })
    .select("notification_id")
    .single();

  if (error) {
    console.error("[createNotification]", error.message);
    return null;
  }

  // Broadcast to the specific user's notification channel
  await supabase
    .channel(`notifications:${params.recipient_type}:${params.recipient_id}`)
    .send({
      type: "broadcast",
      event: "new_notification",
      payload: { id: data.notification_id, ...params },
    });

  return data.notification_id;
}

export async function getNotifications(
  recipientType: "dispatcher" | "driver" | "broker",
  recipientId: number,
  limit: number = 20
) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_type", recipientType)
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getNotifications]", error.message);
    throw error;
  }

  return data || [];
}

export async function getUnreadCount(
  recipientType: "dispatcher" | "driver" | "broker",
  recipientId: number
) {
  const supabase = await getSupabaseServerClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_type", recipientType)
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    console.error("[getUnreadCount]", error.message);
    return 0;
  }

  return count || 0;
}

export async function markRead(notificationId: number) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("notification_id", notificationId);

  if (error) {
    console.error("[markRead]", error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function markAllRead(
  recipientType: "dispatcher" | "driver" | "broker",
  recipientId: number
) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_type", recipientType)
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    console.error("[markAllRead]", error.message);
    return { error: error.message };
  }

  return { success: true };
}
