// Maildrop API client — https://docs.maildrop.cc
// No auth required. GraphQL over HTTPS.
// maildrop.cc is widely accepted and not on common blocklists.

const API = "https://api.maildrop.cc/graphql";

export interface DropMessage {
  id: string;
  date: string;
  mailfrom: string;
  headerfrom: string;
  subject: string;
  data: string;   // plain text body
  html: string;   // HTML body (may be empty)
  seen: boolean;  // tracked client-side
}

async function gql<T>(query: string, variables?: Record<string, string>): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Maildrop ${res.status}`);
  const json = await res.json() as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

/** Generate a random mailbox name */
export function randomMailbox(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Full email address from mailbox name */
export function toAddress(mailbox: string): string {
  return `${mailbox}@maildrop.cc`;
}

/** List messages in a mailbox (summary — no body) */
export async function listMessages(mailbox: string): Promise<DropMessage[]> {
  const data = await gql<{ inbox: Omit<DropMessage, "data" | "html" | "seen">[] }>(`
    query($mailbox: String) {
      inbox(mailbox: $mailbox) {
        id date mailfrom headerfrom subject
      }
    }
  `, { mailbox });
  return (data.inbox ?? []).map((m) => ({ ...m, data: "", html: "", seen: false }));
}

/** Fetch full message body */
export async function getMessage(mailbox: string, id: string): Promise<DropMessage> {
  const data = await gql<{ message: Omit<DropMessage, "seen"> | null }>(`
    query($mailbox: String, $id: String) {
      message(mailbox: $mailbox, id: $id) {
        id date mailfrom headerfrom subject data html
      }
    }
  `, { mailbox, id });
  if (!data.message) throw new Error("Message not found");
  return { ...data.message, seen: true };
}

/** Delete a message */
export async function deleteMessage(mailbox: string, id: string): Promise<void> {
  await gql(`
    mutation($mailbox: String, $id: String) {
      delete(mailbox: $mailbox, id: $id)
    }
  `, { mailbox, id });
}

// ── OTP extraction (shared utility) ──────────────────────────────────────────
export function extractOTP(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ");
  const hasDigit = (v: string) => /\d/.test(v);

  const keyword = /(?:code|otp|verification|verify|pin|passcode|confirm|security)[^A-Z0-9]{0,20}([A-Z0-9]{4,8})/gi;
  for (const match of cleaned.matchAll(keyword)) {
    const candidate = (match[1] ?? "").toUpperCase();
    if (hasDigit(candidate)) return candidate;
  }

  const m2 = cleaned.match(/(?:^|[^0-9])(\d{4,8})(?:[^0-9]|$)/);
  if (m2) return m2[1];
  return null;
}
