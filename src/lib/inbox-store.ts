import { useEffect, useState } from "react";
import type { SLAlias } from "./simplelogin";

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEY_INBOXES  = "tempmail.inboxes.v2";   // string[] — maildrop mailbox names
const KEY_SL       = "tempmail.sl.aliases.v1";
const KEY_SL_KEY   = "tempmail.sl.apikey.v1";
const KEY_ACTIVE   = "tempmail.active.v1";
const KEY_MODE     = "tempmail.mode.v1";
const KEY_THEME    = "tempmail.theme.v1";

export type Mode = "maildrop" | "simplelogin";

// ── Listener bus ──────────────────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }

function ls<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
  emit();
}

// ── Maildrop inboxes (just mailbox names) ─────────────────────────────────────
export function getInboxes(): string[] { return ls<string[]>(KEY_INBOXES, []); }
export function addInbox(mailbox: string) {
  const all = getInboxes();
  if (!all.includes(mailbox)) lsSet(KEY_INBOXES, [mailbox, ...all]);
  setActiveId(mailbox);
}
export function removeInbox(mailbox: string) {
  const next = getInboxes().filter((x) => x !== mailbox);
  lsSet(KEY_INBOXES, next);
  if (getActiveId() === mailbox) setActiveId(next[0] ?? null);
}

// ── SimpleLogin aliases ───────────────────────────────────────────────────────
export function getSLAliases(): SLAlias[] { return ls<SLAlias[]>(KEY_SL, []); }
export function setSLAliases(aliases: SLAlias[]) { lsSet(KEY_SL, aliases); }
export function addSLAlias(a: SLAlias) {
  const all = getSLAliases();
  if (!all.find((x) => x.id === a.id)) lsSet(KEY_SL, [a, ...all]);
  setActiveId(String(a.id));
}
export function removeSLAlias(id: number) {
  const next = getSLAliases().filter((x) => x.id !== id);
  lsSet(KEY_SL, next);
  if (getActiveId() === String(id)) setActiveId(next[0] ? String(next[0].id) : null);
}

// ── SimpleLogin API key ───────────────────────────────────────────────────────
export function getSLApiKey(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(KEY_SL_KEY) ?? "";
}
export function setSLApiKey(key: string) {
  localStorage.setItem(KEY_SL_KEY, key);
  emit();
}

// ── Active id ─────────────────────────────────────────────────────────────────
export function getActiveId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(KEY_ACTIVE);
}
export function setActiveId(id: string | null) {
  if (id) localStorage.setItem(KEY_ACTIVE, id);
  else localStorage.removeItem(KEY_ACTIVE);
  emit();
}

// ── Mode ──────────────────────────────────────────────────────────────────────
export function getMode(): Mode {
  if (typeof localStorage === "undefined") return "maildrop";
  return (localStorage.getItem(KEY_MODE) as Mode) || "maildrop";
}
export function setMode(m: Mode) {
  localStorage.setItem(KEY_MODE, m);
  emit();
}

// ── Theme ─────────────────────────────────────────────────────────────────────
export function getTheme(): "dark" | "light" {
  if (typeof localStorage === "undefined") return "dark";
  return (localStorage.getItem(KEY_THEME) as "dark" | "light") || "dark";
}
export function setTheme(t: "dark" | "light") {
  localStorage.setItem(KEY_THEME, t);
  document.documentElement.classList.toggle("light", t === "light");
  document.documentElement.classList.toggle("dark", t === "dark");
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useStore() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    inboxes:   getInboxes(),
    slAliases: getSLAliases(),
    slApiKey:  getSLApiKey(),
    activeId:  getActiveId(),
    mode:      getMode(),
  };
}

// Legacy compat
export function useInboxes() {
  const s = useStore();
  return { inboxes: s.inboxes, activeId: s.activeId };
}
