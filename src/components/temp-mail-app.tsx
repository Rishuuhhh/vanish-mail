import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Inbox as InboxIcon, Plus, Sun, Moon, Trash2, Copy, Check,
  RefreshCw, Sparkles, ShieldCheck, Zap, Home, ArrowRight,
  Mail, Terminal, Lock, Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAccount, listMessages, getMessage, deleteMessage,
  deleteAccount, extractOTP,
  type MailMessageSummary, type MailMessageFull, type MailAccount,
} from "@/lib/mailtm";
import {
  addInbox, removeInbox, setActiveId,
  useInboxes, getTheme, setTheme,
} from "@/lib/inbox-store";
import { formatDistanceToNow } from "date-fns";

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed = 48, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return displayed;
}

/* ── Page transition wrapper ── */
function PageTransition({ id, dir, children }: {
  id: string; dir: "up" | "right"; children: React.ReactNode;
}) {
  return (
    <div key={id} className={dir === "up" ? "page-enter-up" : "page-enter-right"}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   ROOT
════════════════════════════════════════════ */
export function App() {
  const { inboxes, activeId } = useInboxes();
  const active = inboxes.find((i) => i.id === activeId) || inboxes[0];
  const [creating, setCreating] = useState(false);
  const [theme, setT] = useState<"dark" | "light">("dark");
  const [view, setView] = useState<"home" | "inbox">("home");

  useEffect(() => { const t = getTheme(); setT(t); setTheme(t); }, []);
  useEffect(() => {
    if (inboxes.length > 0 && view === "home") setView("inbox");
  }, [inboxes.length]); // eslint-disable-line

  async function newInbox() {
    setCreating(true);
    try {
      const acc = await createAccount();
      addInbox(acc);
      setView("inbox");
      toast.success("inbox spawned", { description: acc.address });
    } catch (e: any) {
      toast.error("failed", { description: e.message });
    } finally { setCreating(false); }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setT(next); setTheme(next);
  }

  if (view === "home" || !inboxes.length) {
    return (
      <PageTransition id="home" dir="up">
        <Landing
          onCreate={newInbox} creating={creating}
          theme={theme} onToggleTheme={toggleTheme}
          hasInboxes={inboxes.length > 0}
          onGoToInbox={() => setView("inbox")}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition id="inbox" dir="right">
      <InboxView
        inboxes={inboxes} active={active}
        onNew={newInbox} creating={creating}
        theme={theme} onToggleTheme={toggleTheme}
        onGoHome={() => setView("home")}
      />
    </PageTransition>
  );
}

/* ════════════════════════════════════════════
   LANDING — cinematic, asymmetric, typographic
════════════════════════════════════════════ */
function Landing({ onCreate, creating, theme, onToggleTheme, hasInboxes, onGoToInbox }: {
  onCreate: () => void; creating: boolean; theme: string;
  onToggleTheme: () => void; hasInboxes: boolean; onGoToInbox: () => void;
}) {
  const line1 = useTypewriter("disposable", 52, 400);
  const line2 = useTypewriter("inbox.", 52, 400 + "disposable".length * 52 + 180);
  const done1 = line1.length === "disposable".length;
  const done2 = line2.length === "inbox.".length;

  return (
    <div className="min-h-screen relative" style={{ background: "var(--color-background)" }}>
      {/* Background scene */}
      <div className="bg-scene" />
      {/* Ambient glow spots */}
      <div className="glow-spot w-[700px] h-[500px] -top-48 -left-32 opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }} />
      <div className="glow-spot w-[500px] h-[500px] top-1/2 -right-64 opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }} />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg grid place-items-center"
            style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)" }}>
            <InboxIcon className="w-3.5 h-3.5 text-cyan" />
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            vanish<span className="text-cyan">.mail</span>
          </span>
          <span className="ml-2 text-xs mono px-2 py-0.5 rounded"
            style={{ color: "var(--dim)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            v2
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasInboxes && (
            <button onClick={onGoToInbox}
              className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs">
              <Activity className="w-3.5 h-3.5" /> open inbox
            </button>
          )}
          <button onClick={onToggleTheme} aria-label="toggle theme"
            className="btn-ghost w-8 h-8 rounded-lg grid place-items-center">
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </nav>

      {/* ── Hero — left-aligned, asymmetric ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-40">
        <div className="max-w-3xl">

          {/* Status line */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="live-dot" />
            <span className="mono text-xs tracking-widest uppercase" style={{ color: "var(--dim)" }}>
              system online · mail.tm
            </span>
          </div>

          {/* Giant typewriter headline */}
          <h1 className="font-bold leading-[0.95] tracking-[-0.04em] mb-8"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", color: "var(--color-foreground)" }}>
            <span className="block" style={{ color: "rgba(226,232,240,0.35)", fontSize: "0.55em", letterSpacing: "-0.02em", marginBottom: "0.1em" }}>
              your
            </span>
            <span className="block grad-cyan">
              {line1}
              {!done1 && <span className="tw-cursor" />}
            </span>
            {done1 && (
              <span className="block" style={{ color: "var(--color-foreground)" }}>
                {line2}
                {!done2 && <span className="tw-cursor" />}
                {done2 && <span className="tw-cursor" />}
              </span>
            )}
          </h1>

          {/* Sub copy — restrained, left-aligned */}
          <p className="text-base leading-relaxed mb-12 max-w-md"
            style={{ color: "var(--dim)", letterSpacing: "-0.005em" }}>
            Spawn a throwaway address in one keystroke.
            Intercept OTPs. Disappear. No accounts, no traces.
          </p>

          {/* CTA row */}
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={onCreate} disabled={creating}
              className="btn-primary inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-sm">
              {creating
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Terminal className="w-4 h-4" />}
              {creating ? "spawning…" : "spawn inbox"}
            </button>
            {hasInboxes && (
              <button onClick={onGoToInbox}
                className="btn-ghost inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm">
                resume session <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Attribute strip */}
          <div className="flex items-center gap-6 mt-16 flex-wrap">
            {[
              { icon: Zap,          label: "instant" },
              { icon: Lock,         label: "no account" },
              { icon: ShieldCheck,  label: "local only" },
              { icon: Activity,     label: "live OTP" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--dim)" }} />
                <span className="mono text-xs tracking-wide uppercase" style={{ color: "var(--dim)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column — terminal preview card ── */}
        <div className="absolute right-8 top-24 w-80 hidden xl:block float-y">
          <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid rgba(34,211,238,0.12)" }}>
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#fbbf24" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4ade80" }} />
              </div>
              <span className="mono text-xs ml-2" style={{ color: "var(--dim)" }}>vanish.mail — inbox</span>
            </div>
            {/* Terminal body */}
            <div className="p-4 space-y-2">
              <div className="mono text-xs" style={{ color: "var(--dim)" }}>
                <span style={{ color: "var(--cyan)" }}>$</span> spawn --new
              </div>
              <div className="mono text-xs" style={{ color: "var(--green)" }}>
                ✓ address allocated
              </div>
              <div className="mono text-xs truncate" style={{ color: "rgba(226,232,240,0.6)" }}>
                → xk9m2p@mail.tm
              </div>
              <div className="rule my-3" />
              <div className="mono text-xs" style={{ color: "var(--dim)" }}>
                <span style={{ color: "var(--cyan)" }}>$</span> listen --live
              </div>
              <div className="mono text-xs" style={{ color: "var(--dim)" }}>
                waiting for messages<span className="tw-cursor" style={{ background: "var(--dim)" }} />
              </div>
              <div className="rule my-3" />
              {/* OTP preview */}
              <div className="rounded-lg p-3 otp-block">
                <div className="mono text-xs mb-2" style={{ color: "rgba(74,222,128,0.6)" }}>
                  OTP DETECTED
                </div>
                <div className="otp-code text-2xl">482 917</div>
                <div className="mono text-xs mt-2" style={{ color: "rgba(74,222,128,0.5)" }}>
                  expires 10:00
                </div>
              </div>
            </div>
          </div>
          {/* Ambient glow under card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 blur-3xl opacity-20 rounded-full"
            style={{ background: "var(--cyan)" }} />
        </div>

        {/* ── Feature list — horizontal rule style ── */}
        <div className="mt-32 max-w-xl">
          <div className="mono text-xs tracking-widest uppercase mb-6" style={{ color: "var(--dim)" }}>
            how it works
          </div>
          <div>
            {[
              { n: "01", title: "spawn", body: "One click generates a live address via mail.tm. No forms." },
              { n: "02", title: "receive", body: "Messages arrive in real time. Auto-refreshes every 5 seconds." },
              { n: "03", title: "extract", body: "OTPs are detected and surfaced instantly. Copy in one tap." },
              { n: "04", title: "vanish", body: "Delete the inbox. No history, no footprint, no account." },
            ].map((f) => (
              <div key={f.n} className="feat-row stagger">
                <span className="feat-num">{f.n}</span>
                <div>
                  <div className="text-sm font-semibold mb-0.5 tracking-tight"
                    style={{ color: "var(--color-foreground)" }}>
                    {f.title}
                  </div>
                  <div className="text-sm" style={{ color: "var(--dim)", lineHeight: 1.6 }}>
                    {f.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════
   INBOX VIEW
════════════════════════════════════════════ */
function InboxView({ inboxes, active, onNew, creating, theme, onToggleTheme, onGoHome }: {
  inboxes: MailAccount[]; active: MailAccount | undefined;
  onNew: () => void; creating: boolean; theme: string;
  onToggleTheme: () => void; onGoHome: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
      <div className="bg-scene" />

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,11,16,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md grid place-items-center"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <InboxIcon className="w-3 h-3 text-cyan" />
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            vanish<span className="text-cyan">.mail</span>
          </span>
          <div className="rule w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.08)", width: 1 }} />
          <div className="flex items-center gap-1.5">
            <div className="live-dot" />
            <span className="mono text-xs" style={{ color: "var(--dim)" }}>live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGoHome}
            className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            <Home className="w-3.5 h-3.5" /> home
          </button>
          <button onClick={onNew} disabled={creating}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            new
          </button>
          <button onClick={onToggleTheme} aria-label="toggle theme"
            className="btn-ghost w-7 h-7 rounded-lg grid place-items-center">
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ── Main grid ── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_340px_1fr]"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <Sidebar inboxes={inboxes} activeId={active?.id ?? null} />
        {active ? <InboxPane key={active.id} account={active} /> : null}
      </div>
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ inboxes, activeId }: { inboxes: MailAccount[]; activeId: string | null }) {
  return (
    <aside className="relative z-10 p-3 overflow-y-auto scrollbar-thin"
      style={{ borderRight: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
      <div className="px-2 py-2 mono text-xs tracking-widest uppercase" style={{ color: "var(--dim)" }}>
        sessions · {inboxes.length}
      </div>
      <ul className="space-y-0.5 mt-1">
        {inboxes.map((i) => (
          <li key={i.id}>
            <button onClick={() => setActiveId(i.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs mono truncate transition-all"
              style={i.id === activeId
                ? { background: "rgba(34,211,238,0.08)", color: "var(--cyan)", borderLeft: "2px solid var(--cyan)", paddingLeft: "10px" }
                : { color: "var(--dim)", borderLeft: "2px solid transparent", paddingLeft: "10px" }}>
              {i.address}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ── Inbox Pane ── */
function InboxPane({ account }: { account: MailAccount }) {
  const [messages, setMessages] = useState<MailMessageSummary[]>([]);
  const [selected, setSelected] = useState<MailMessageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try { setMessages(await listMessages(account.token)); }
    catch (e: any) { if (!silent) toast.error("fetch failed", { description: e.message }); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    setSelected(null); refresh();
    const iv = setInterval(() => refresh(true), 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id]);

  async function open(id: string) {
    try {
      const full = await getMessage(account.token, id);
      setSelected(full);
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, seen: true } : x)));
    } catch (e: any) { toast.error("open failed", { description: e.message }); }
  }

  async function copyAddr() {
    await navigator.clipboard.writeText(account.address);
    setCopied(true); toast.success("copied");
    setTimeout(() => setCopied(false), 1500);
  }

  async function destroy() {
    if (!confirm("Delete this inbox?")) return;
    try { await deleteAccount(account.token, account.id); } catch {}
    removeInbox(account.id); toast.success("inbox destroyed");
  }

  async function delMsg(id: string) {
    try {
      await deleteMessage(account.token, id);
      setMessages((m) => m.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e: any) { toast.error("delete failed", { description: e.message }); }
  }

  return (
    <>
      {/* Message list */}
      <section className="relative z-10 flex flex-col min-h-0 xl:max-h-[calc(100vh-49px)] scrollbar-thin"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>

        {/* Address header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mono text-xs mb-2.5 tracking-widest uppercase" style={{ color: "var(--dim)" }}>
            active address
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg text-xs mono truncate"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--color-foreground)" }}>
              {account.address}
            </code>
            <button onClick={copyAddr}
              className="w-8 h-8 rounded-lg grid place-items-center btn-ghost transition-all"
              aria-label="copy"
              style={{ color: copied ? "var(--cyan)" : undefined }}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => refresh()}
              className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> refresh
            </button>
            <button onClick={destroy}
              className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ color: "var(--color-destructive)" }}>
              <Trash2 className="w-3 h-3" /> destroy
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="live-dot" />
              <span className="mono text-xs" style={{ color: "var(--dim)" }}>5s</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && !messages.length ? <LoadingSkeleton /> :
           messages.length === 0 ? <EmptyInbox /> : (
            <ul>
              {messages.map((m, idx) => {
                const otp = extractOTP(`${m.subject} ${m.intro}`);
                const isSel = selected?.id === m.id;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => open(m.id)}
                      className={`msg-row w-full text-left px-5 py-4 transition-all ${isSel ? "msg-active" : "hover:bg-white/[0.02]"}`}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        animationDelay: `${idx * 0.04}s`,
                        opacity: m.seen && !isSel ? 0.5 : 1,
                        borderLeft: isSel ? undefined : "2px solid transparent",
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        {!m.seen && <div className="live-dot" style={{ width: 5, height: 5 }} />}
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                          {m.from.name || m.from.address}
                        </span>
                        <span className="ml-auto mono text-xs shrink-0" style={{ color: "var(--dim)" }}>
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false })}
                        </span>
                      </div>
                      <div className="text-xs truncate mb-0.5" style={{ color: "rgba(226,232,240,0.7)" }}>
                        {m.subject || "(no subject)"}
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--dim)" }}>
                        {m.intro}
                      </div>
                      {otp && (
                        <div className="mt-2">
                          <span className="otp-badge">OTP {otp}</span>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Reader — desktop */}
      <section className="relative z-10 hidden xl:flex flex-col min-h-0 max-h-[calc(100vh-49px)]">
        {selected
          ? <MessageView key={selected.id} message={selected} onDelete={() => delMsg(selected.id)} />
          : <EmptyReader />}
      </section>

      {/* Reader — mobile */}
      {selected && (
        <div className="xl:hidden fixed inset-0 z-50 overflow-y-auto drawer-enter"
          style={{ background: "var(--color-background)" }}>
          <MessageView key={selected.id} message={selected} onDelete={() => delMsg(selected.id)} onClose={() => setSelected(null)} />
        </div>
      )}
    </>
  );
}

/* ── Message View ── */
function MessageView({ message, onDelete, onClose }: {
  message: MailMessageFull; onDelete: () => void; onClose?: () => void;
}) {
  const otp = extractOTP(`${message.subject} ${message.text || ""}`);
  return (
    <div className="flex flex-col h-full detail-enter relative">
      {/* Ambient glow when OTP present */}
      {otp && <div className="ambient-glow" />}

      {/* Header */}
      <div className="relative px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold leading-snug tracking-tight mb-1"
              style={{ color: "var(--color-foreground)" }}>
              {message.subject || "(no subject)"}
            </h2>
            <div className="mono text-xs" style={{ color: "var(--dim)" }}>
              {message.from.name || message.from.address}
              <span className="mx-2 opacity-40">·</span>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onClose && (
              <button onClick={onClose}
                className="btn-ghost px-3 py-1.5 rounded-lg text-xs">
                esc
              </button>
            )}
            <button onClick={onDelete}
              className="btn-ghost w-7 h-7 rounded-lg grid place-items-center"
              aria-label="delete" style={{ color: "var(--color-destructive)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* OTP block — the hero moment */}
        {otp && (
          <div className="mt-5 rounded-xl p-5 otp-block relative overflow-hidden">
            <div className="mono text-xs tracking-widest uppercase mb-3"
              style={{ color: "rgba(74,222,128,0.6)" }}>
              verification code detected
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="otp-code" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{otp}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(otp); toast.success("code copied"); }}
                className="btn-primary px-5 py-2.5 rounded-lg text-xs shrink-0"
                style={{ background: "var(--green)", color: "#080b10", boxShadow: "0 0 20px -4px rgba(74,222,128,0.4)" }}>
                copy
              </button>
            </div>
            {/* Scan line effect */}
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.4), transparent)" }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
        {message.html?.length ? (
          <iframe
            title="message" sandbox=""
            srcDoc={`<style>body{color:#e2e8f0;font-family:ui-sans-serif,system-ui;background:transparent;margin:0;padding:0;line-height:1.65;font-size:14px}a{color:#22d3ee}img{max-width:100%}</style>${message.html.join("")}`}
            className="w-full min-h-[400px] border-0 bg-transparent"
            style={{ colorScheme: "dark" }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: "rgba(226,232,240,0.75)", fontFamily: "var(--font-sans)" }}>
            {message.text}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ── Empty / Loading ── */
function EmptyInbox() {
  return (
    <div className="flex flex-col items-start px-5 py-10">
      <div className="mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--dim)" }}>
        no messages
      </div>
      <div className="flex items-center gap-2">
        <div className="live-dot" />
        <span className="mono text-xs" style={{ color: "var(--dim)" }}>
          listening for incoming mail…
        </span>
      </div>
      <div className="mt-8 space-y-2 w-full">
        {[60, 45, 70].map((w, i) => (
          <div key={i} className="shimmer rounded h-2" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

function EmptyReader() {
  return (
    <div className="flex-1 flex flex-col items-start justify-end px-6 pb-10">
      <div className="mono text-xs tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.1)" }}>
        no message selected
      </div>
      <div className="mono text-xs" style={{ color: "rgba(255,255,255,0.08)" }}>
        select a message from the list →
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-5 py-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="shimmer rounded h-2.5 w-2/3" />
          <div className="shimmer rounded h-2 w-full" />
          <div className="shimmer rounded h-2 w-4/5" />
        </div>
      ))}
    </div>
  );
}
