// Mail.tm API client — https://docs.mail.tm
const API = "https://api.mail.tm";

export interface MailDomain { id: string; domain: string; isActive: boolean }
export interface MailAccount { id: string; address: string; password: string; token: string }
export interface MailMessageSummary {
  id: string;
  from: { address: string; name?: string };
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
}
export interface MailMessageFull extends MailMessageSummary {
  to: { address: string; name?: string }[];
  text: string;
  html: string[];
}

async function req<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Mail.tm ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return res.json() as Promise<T>;
}

export async function getDomains(): Promise<MailDomain[]> {
  const data = await req<any>("/domains?page=1");
  const list = data["hydra:member"] ?? data.member ?? data;
  return (list as MailDomain[]).filter((d) => d.isActive);
}

function randomLocal() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function randomPass() {
  return crypto.randomUUID().replace(/-/g, "") + "X1!";
}

export async function createAccount(domain?: string): Promise<MailAccount> {
  let dom = domain;
  if (!dom) {
    const domains = await getDomains();
    if (!domains.length) throw new Error("No mail.tm domains available");
    dom = domains[Math.floor(Math.random() * domains.length)].domain;
  }
  const address = `${randomLocal()}@${dom}`;
  const password = randomPass();
  const acc = await req<{ id: string; address: string }>("/accounts", {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });
  const tok = await req<{ token: string }>("/token", {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });
  return { id: acc.id, address, password, token: tok.token };
}

export async function listMessages(token: string): Promise<MailMessageSummary[]> {
  const data = await req<any>("/messages?page=1", {}, token);
  return (data["hydra:member"] ?? data.member ?? data) as MailMessageSummary[];
}

export async function getMessage(token: string, id: string): Promise<MailMessageFull> {
  return req<MailMessageFull>(`/messages/${id}`, {}, token);
}

export async function deleteMessage(token: string, id: string): Promise<void> {
  await fetch(`${API}/messages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  await fetch(`${API}/accounts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// OTP / verification code extraction
export function extractOTP(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ");
  const hasDigit = (value: string) => /\d/.test(value);

  // Prefer codes near keywords, but require at least one digit to avoid false positives like "YOUR".
  const keyword =
    /(?:code|otp|verification|verify|pin|passcode|confirm|security)[^A-Z0-9]{0,20}([A-Z0-9]{4,8})/gi;
  for (const match of cleaned.matchAll(keyword)) {
    const candidate = (match[1] ?? "").toUpperCase();
    if (hasDigit(candidate)) return candidate;
  }

  // Numeric code 4-8 digits standalone
  const m2 = cleaned.match(/(?:^|[^0-9])(\d{4,8})(?:[^0-9]|$)/);
  if (m2) return m2[1];
  return null;
}
