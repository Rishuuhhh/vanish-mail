import { useEffect, useState } from "react";
import type { MailAccount } from "./mailtm";

const KEY = "tempmail.inboxes.v1";
const ACTIVE = "tempmail.active.v1";
const THEME = "tempmail.theme.v1";

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }

function read(): MailAccount[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(v: MailAccount[]) { localStorage.setItem(KEY, JSON.stringify(v)); emit(); }

export function getInboxes(): MailAccount[] { return read(); }
export function addInbox(a: MailAccount) {
  const all = read();
  if (!all.find((x) => x.id === a.id)) write([a, ...all]);
  setActiveId(a.id);
}
export function removeInbox(id: string) {
  const next = read().filter((x) => x.id !== id);
  write(next);
  if (getActiveId() === id) setActiveId(next[0]?.id ?? null);
}
export function getActiveId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACTIVE);
}
export function setActiveId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE, id);
  else localStorage.removeItem(ACTIVE);
  emit();
}

export function useInboxes() {
  const [, setT] = useState(0);
  useEffect(() => {
    const l = () => setT((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { inboxes: getInboxes(), activeId: getActiveId() };
}

export function getTheme(): "dark" | "light" {
  if (typeof localStorage === "undefined") return "dark";
  return (localStorage.getItem(THEME) as "dark" | "light") || "dark";
}
export function setTheme(t: "dark" | "light") {
  localStorage.setItem(THEME, t);
  document.documentElement.classList.toggle("light", t === "light");
  document.documentElement.classList.toggle("dark", t === "dark");
}
