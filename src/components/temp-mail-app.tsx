import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Inbox as InboxIcon, Plus, Sun, Moon, Trash2, Copy, Check,
  RefreshCw, Sparkles, Mail, ShieldCheck, Zap, Home, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAccount, listMessages, getMessage, deleteMessage,
  deleteAccount, extractOTP,
  type MailMessageSummary, type MailMessageFull, type MailAccount,
} from "@/lib/mailtm";
import {
  addInbox, getActiveId, removeInbox, setActiveId,
  useInboxes, getTheme, setTheme,
} from "@/lib/inbox-store";
import { formatDistanceToNow } from "date-fns";

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */
export function App() {
  const { inboxes, activeId } = useInboxes();
  const active = inboxes.find((i) => i.id === activeId) || inboxes[0];
  const [creating, setCreating] = useState(false);
  const [theme, setT] = useState<"dark" | "light">("dark");
  const [view, setView] = useState<"home" | "inbox">("home");

  useEffect(() => {
    const t = getTheme();
    setT(t);
    setTheme(t);
  }, []);

  useEffect(() => {
    if (inboxes.length > 0 && view === "home") setView("inbox");
  }, [inboxes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function newInbox() {
    setCreating(true);
    try {
      const acc = await createAccount();
      addInbox(acc);
      setView("inbox");
      toast.success("✨ Inbox ready!", { description: acc.address });
    } catch (e: any) {
      toast.error("Couldn't create inbox", { description: e.message });
    } finally {
      setCreating(false);
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setT(next);
    setTheme(next);
  }

  if (view === "home" || !inboxes.length) {
    return (
      <Landing
        onCreate={newInbox} creating={creating}
        theme={theme} onToggleTheme={toggleTheme}
        hasInboxes={inboxes.length > 0}
        onGoToInbox={() => setView("inbox")}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
      <AppHeader
        onNew={newInbox} creating={creating}
        theme={theme} onToggleTheme={toggleTheme}
        onGoHome={() => setView("home")}
      />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_360px_1fr]"
        style={{ borderTop: "1px solid var(--color-border)" }}>
        <Sidebar inboxes={inboxes} activeId={active?.id ?? null} />
        {active ? <InboxPane key={active.id} account={active} /> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Landing
───────────────────────────────────────────── */
function Landing({ onCreate, creating, theme, onToggleTheme, hasInboxes, onGoToInbox }: {
  onCreate: () => void; creating: boolean; theme: string;
  onToggleTheme: () => void; hasInboxes: boolean; onGoToInbox: () => void;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--color-background)" }}>
      {/* Blobs */}
      <div className="blob blob-1 w-[520px] h-[520px] -top-32 -left-32"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, #7c3aed 60%, transparent 100%)" }} />
      <div className="blob blob-2 w-[480px] h-[480px] top-1/3 -right-40"
        style={{ background: "radial-gradient(circle, #f472b6 0%, #db2777 60%, transparent 100%)" }} />
      <div className="blob blob-3 w-[400px] h-[400px] -bottom-24 left-1/4"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, #0284c7 60%, transparent 100%)" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-xl grid place-items-center btn-grad text-white shadow-lg">
            <InboxIcon className="w-4 h-4" />
          </div>
          <span style={{ color: "var(--color-foreground)" }}>
            vanish<span className="grad-text">.mail</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {hasInboxes && (
            <button onClick={onGoToInbox}
              className="glass-light inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105 active:scale-95"
              style={{ color: "var(--color-foreground)" }}>
              <InboxIcon className="w-4 h-4" /> my inboxes
            </button>
          )}
          <button onClick={onToggleTheme} aria-label="toggle theme"
            className="glass-light w-9 h-9 rounded-xl grid place-items-center transition hover:scale-110 active:scale-95"
            style={{ color: "var(--color-foreground)" }}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="tag mb-6 mx-auto lg:mx-0">
              <span className="pulse-dot" />
              live · powered by mail.tm
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
              style={{ color: "var(--color-foreground)" }}>
              your{" "}
              <span className="grad-text">disposable</span>
              <br />inbox,{" "}
              <span className="grad-text-warm">instantly</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0"
              style={{ color: "var(--color-muted-foreground)" }}>
              Generate a throwaway email in one tap. Catch OTPs, verify accounts,
              and stay spam-free — no sign-up ever.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
              <button onClick={onCreate} disabled={creating}
                className="btn-grad inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-base font-bold">
                {creating
                  ? <RefreshCw className="w-5 h-5 animate-spin" />
                  : <Sparkles className="w-5 h-5" />}
                {creating ? "generating…" : "get my inbox"}
              </button>
              {hasInboxes && (
                <button onClick={onGoToInbox}
                  className="glass inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold transition hover:scale-105 active:scale-95"
                  style={{ color: "var(--color-foreground)" }}>
                  open inbox <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Social proof strip */}
            <div className="mt-10 flex items-center gap-4 justify-center lg:justify-start flex-wrap">
              {["no sign-up", "100% free", "auto OTP", "private"].map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="flex-shrink-0 relative w-72 h-72 hidden lg:block">
            {/* Soft 3-D inbox card */}
            <div className="glass card-3d rounded-3xl p-6 w-64 absolute top-4 left-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl btn-grad grid place-items-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--color-muted-foreground)" }}>new message</div>
                  <div className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>Verification Code</div>
                </div>
              </div>
              <div className="rounded-2xl p-3 mb-3" style={{ background: "rgba(167,139,250,0.12)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted-foreground)" }}>your OTP</div>
                <div className="font-mono text-3xl font-black grad-text tracking-widest">482 917</div>
              </div>
              <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>expires in 10 minutes</div>
            </div>
            {/* Floating emoji stickers */}
            <div className="float-1 absolute -top-6 right-0 text-4xl select-none">✨</div>
            <div className="float-2 absolute bottom-0 -right-4 text-3xl select-none">🔒</div>
            <div className="float-3 absolute top-1/2 -left-8 text-3xl select-none">⚡</div>
          </div>
        </div>

        {/* Feature cards */}
        <div id="how" className="mt-28 grid sm:grid-cols-3 gap-5">
          {[
            { icon: Zap,        emoji: "⚡", title: "instant",  color: "#fb923c", body: "A working inbox in seconds. No forms, no friction." },
            { icon: ShieldCheck, emoji: "🔒", title: "private",  color: "#a78bfa", body: "Zero sign-up. Everything lives in your browser only." },
            { icon: Mail,       emoji: "✉️", title: "otp-ready", color: "#f472b6", body: "Codes are highlighted the moment they land." },
          ].map((f) => (
            <div key={f.title} className="glass card-3d rounded-3xl p-6 relative overflow-hidden noise">
              <div className="text-3xl mb-4">{f.emoji}</div>
              <div className="text-base font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
                {f.title}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                {f.body}
              </div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl"
                style={{ background: f.color }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   App Header (inbox view)
───────────────────────────────────────────── */
function AppHeader({ onNew, creating, theme, onToggleTheme, onGoHome }: {
  onNew: () => void; creating: boolean; theme: string;
  onToggleTheme: () => void; onGoHome: () => void;
}) {
  return (
    <header className="glass-light relative z-10 px-5 py-3.5 flex items-center justify-between"
      style={{ borderBottom: "1px solid var(--color-border)" }}>
      <Link to="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
        <div className="w-8 h-8 rounded-xl grid place-items-center btn-grad text-white">
          <InboxIcon className="w-4 h-4" />
        </div>
        <span style={{ color: "var(--color-foreground)" }}>
          vanish<span className="grad-text">.mail</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <button onClick={onGoHome}
          className="glass-light inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition hover:scale-105 active:scale-95"
          style={{ color: "var(--color-foreground)" }}>
          <Home className="w-4 h-4" /> home
        </button>
        <button onClick={onNew} disabled={creating}
          className="btn-grad inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold">
          {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          new
        </button>
        <button onClick={onToggleTheme} aria-label="toggle theme"
          className="glass-light w-9 h-9 rounded-xl grid place-items-center transition hover:scale-110 active:scale-95"
          style={{ color: "var(--color-foreground)" }}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────── */
function Sidebar({ inboxes, activeId }: { inboxes: MailAccount[]; activeId: string | null }) {
  return (
    <aside className="p-3 overflow-y-auto scrollbar-thin"
      style={{ borderRight: "1px solid var(--color-border)", background: "var(--color-card)" }}>
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--color-muted-foreground)" }}>
        inboxes · {inboxes.length}
      </div>
      <ul className="space-y-1 mt-1">
        {inboxes.map((i) => (
          <li key={i.id}>
            <button onClick={() => setActiveId(i.id)}
              className="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-medium truncate transition"
              style={i.id === activeId
                ? { background: "rgba(167,139,250,0.18)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.35)" }
                : { color: "var(--color-foreground)", border: "1px solid transparent" }}>
              {i.address}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   Inbox Pane
───────────────────────────────────────────── */
function InboxPane({ account }: { account: MailAccount }) {
  const [messages, setMessages] = useState<MailMessageSummary[]>([]);
  const [selected, setSelected] = useState<MailMessageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try {
      const list = await listMessages(account.token);
      setMessages(list);
    } catch (e: any) {
      if (!silent) toast.error("Fetch failed", { description: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelected(null);
    refresh();
    const iv = setInterval(() => refresh(true), 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id]);

  async function open(id: string) {
    try {
      const full = await getMessage(account.token, id);
      setSelected(full);
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, seen: true } : x)));
    } catch (e: any) {
      toast.error("Couldn't open message", { description: e.message });
    }
  }

  async function copyAddr() {
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    toast.success("📋 Address copied!");
    setTimeout(() => setCopied(false), 1500);
  }

  async function destroy() {
    if (!confirm("Delete this inbox? This can't be undone.")) return;
    try { await deleteAccount(account.token, account.id); } catch {}
    removeInbox(account.id);
    toast.success("Inbox deleted");
  }

  async function delMsg(id: string) {
    try {
      await deleteMessage(account.token, id);
      setMessages((m) => m.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message });
    }
  }

  return (
    <>
      {/* Message list column */}
      <section className="flex flex-col min-h-0 xl:max-h-[calc(100vh-57px)] scrollbar-thin"
        style={{ borderRight: "1px solid var(--color-border)", background: "var(--color-card)" }}>

        {/* Address bar */}
        <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: "var(--color-muted-foreground)" }}>your address</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 rounded-2xl text-sm font-mono truncate glass-light"
              style={{ color: "var(--color-foreground)" }}>
              {account.address}
            </code>
            <button onClick={copyAddr}
              className="w-10 h-10 rounded-2xl grid place-items-center glass-light transition hover:scale-110 active:scale-95"
              aria-label="copy address"
              style={{ color: copied ? "#a78bfa" : "var(--color-foreground)" }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => refresh()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl glass-light transition hover:scale-105 active:scale-95"
              style={{ color: "var(--color-foreground)" }}>
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> refresh
            </button>
            <button onClick={destroy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl glass-light transition hover:scale-105 active:scale-95"
              style={{ color: "var(--color-destructive)" }}>
              <Trash2 className="w-3 h-3" /> delete
            </button>
            <span className="ml-auto tag">
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              live · 5s
            </span>
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && !messages.length ? (
            <LoadingSkeleton />
          ) : messages.length === 0 ? (
            <EmptyInbox />
          ) : (
            <ul>
              {messages.map((m) => {
                const otp = extractOTP(`${m.subject} ${m.intro}`);
                const isSelected = selected?.id === m.id;
                return (
                  <li key={m.id}>
                    <button onClick={() => open(m.id)}
                      className="w-full text-left p-4 transition"
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: isSelected ? "rgba(167,139,250,0.10)" : "transparent",
                        opacity: m.seen && !isSelected ? 0.65 : 1,
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        {!m.seen && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
                        <span className="text-sm font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                          {m.from.name || m.from.address}
                        </span>
                        <span className="ml-auto text-xs shrink-0 font-mono"
                          style={{ color: "var(--color-muted-foreground)" }}>
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false })}
                        </span>
                      </div>
                      <div className="text-sm truncate font-medium" style={{ color: "var(--color-foreground)" }}>
                        {m.subject || "(no subject)"}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                        {m.intro}
                      </div>
                      {otp && <span className="otp-badge mt-2 inline-block">OTP {otp}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Message reader — desktop */}
      <section className="hidden xl:flex flex-col min-h-0 max-h-[calc(100vh-57px)]"
        style={{ background: "var(--color-background)" }}>
        {selected
          ? <MessageView message={selected} onDelete={() => delMsg(selected.id)} />
          : <EmptyReader />}
      </section>

      {/* Message reader — mobile drawer */}
      {selected && (
        <div className="xl:hidden fixed inset-0 z-40 overflow-y-auto"
          style={{ background: "var(--color-background)" }}>
          <MessageView message={selected} onDelete={() => delMsg(selected.id)} onClose={() => setSelected(null)} />
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   Message View
───────────────────────────────────────────── */
function MessageView({ message, onDelete, onClose }: {
  message: MailMessageFull; onDelete: () => void; onClose?: () => void;
}) {
  const otp = extractOTP(`${message.subject} ${message.text || ""}`);
  return (
    <div className="flex flex-col h-full">
      <div className="p-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--color-foreground)" }}>
              {message.subject || "(no subject)"}
            </h2>
            <div className="mt-1.5 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              from{" "}
              <span style={{ color: "var(--color-foreground)" }}>
                {message.from.name || message.from.address}
              </span>
              {" · "}
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onClose && (
              <button onClick={onClose}
                className="glass-light px-3 py-1.5 rounded-xl text-xs font-semibold transition hover:scale-105"
                style={{ color: "var(--color-foreground)" }}>
                close
              </button>
            )}
            <button onClick={onDelete}
              className="w-9 h-9 rounded-xl grid place-items-center glass-light transition hover:scale-110 active:scale-95"
              aria-label="delete" style={{ color: "var(--color-destructive)" }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OTP highlight card */}
        {otp && (
          <div className="mt-4 rounded-3xl p-5 relative overflow-hidden noise"
            style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(244,114,182,0.12))", border: "1px solid rgba(167,139,250,0.3)" }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: "var(--color-muted-foreground)" }}>
              verification code
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="font-mono text-4xl font-black grad-text tracking-[0.18em]">{otp}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(otp); toast.success("Code copied!"); }}
                className="btn-grad px-5 py-2.5 rounded-2xl text-sm font-bold shrink-0">
                copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
        {message.html?.length ? (
          <iframe
            title="message"
            sandbox=""
            srcDoc={`<style>body{color:#f0eeff;font-family:ui-sans-serif,system-ui;background:transparent;margin:0;padding:0;line-height:1.6}a{color:#a78bfa}img{max-width:100%}</style>${message.html.join("")}`}
            className="w-full min-h-[400px] border-0 bg-transparent"
            style={{ colorScheme: "dark" }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
            style={{ color: "var(--color-foreground)" }}>
            {message.text}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Empty / Loading states
───────────────────────────────────────────── */
function EmptyInbox() {
  return (
    <div className="p-12 text-center">
      <div className="text-5xl mb-4 float-1 inline-block">📭</div>
      <div className="text-base font-bold mb-1" style={{ color: "var(--color-foreground)" }}>
        waiting for mail
      </div>
      <div className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        messages appear here automatically every 5s
      </div>
    </div>
  );
}

function EmptyReader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
      <div className="text-5xl float-2 inline-block">👈</div>
      <div className="text-sm font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
        pick a message to read
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl p-4 shimmer" style={{ height: 72 }} />
      ))}
    </div>
  );
}
