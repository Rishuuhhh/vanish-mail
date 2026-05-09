import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox as InboxIcon, Plus, Sun, Moon, Trash2, Copy, Check, RefreshCw, Sparkles, Mail, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  createAccount,
  listMessages,
  getMessage,
  deleteMessage,
  deleteAccount,
  extractOTP,
  type MailMessageSummary,
  type MailMessageFull,
  type MailAccount,
} from "@/lib/mailtm";
import {
  addInbox,
  getActiveId,
  removeInbox,
  setActiveId,
  useInboxes,
  getTheme,
  setTheme,
} from "@/lib/inbox-store";
import { formatDistanceToNow } from "date-fns";

export function App() {
  const { inboxes, activeId } = useInboxes();
  const active = inboxes.find((i) => i.id === activeId) || inboxes[0];
  const [creating, setCreating] = useState(false);
  const [theme, setT] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = getTheme();
    setT(t);
    setTheme(t);
  }, []);

  async function newInbox() {
    setCreating(true);
    try {
      const acc = await createAccount();
      addInbox(acc);
      toast.success("New inbox ready", { description: acc.address });
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

  if (!inboxes.length) return <Landing onCreate={newInbox} creating={creating} theme={theme} onToggleTheme={toggleTheme} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNew={newInbox} creating={creating} theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_380px_1fr] border-t border-border">
        <Sidebar inboxes={inboxes} activeId={active?.id ?? null} />
        {active ? <InboxPane key={active.id} account={active} /> : null}
      </div>
    </div>
  );
}

function Landing({ onCreate, creating, theme, onToggleTheme }: { onCreate: () => void; creating: boolean; theme: string; onToggleTheme: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, var(--color-primary), transparent 60%)" }} />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, var(--color-accent), transparent 60%)" }} />

      <Header minimal theme={theme} onToggleTheme={onToggleTheme} />

      <main className="relative max-w-5xl mx-auto px-6 pt-20 pb-32">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur text-xs font-mono text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          live inboxes · powered by mail.tm
        </div>
        <h1 className="font-mono text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
          <span className="liquid-title">your calm</span><br />
          <span className="liquid-title text-glow">temp inbox</span>
          <span className="caret" />
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl">
          Create a disposable email in one tap. Receive messages in real time, copy OTPs quickly, and stay private while you test and ship.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button onClick={onCreate} disabled={creating} className="group inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 disabled:opacity-50 transition ring-glow">
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            generate inbox
          </button>
          <a href="#how" className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border font-mono hover:bg-card transition">
            how it works
          </a>
        </div>

        <div id="how" className="mt-32 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "instant setup", body: "A working inbox appears in seconds so you can stay in flow." },
            { icon: ShieldCheck, title: "private by default", body: "No signup required. Everything stays local in your browser." },
            { icon: Mail, title: "otp ready", body: "Verification codes are highlighted the moment messages land." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl glass-soft">
              <f.icon className="w-5 h-5 text-primary mb-4" />
              <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground">{f.title}</div>
              <div className="mt-2 text-foreground">{f.body}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Header({ onNew, creating, minimal, theme, onToggleTheme }: { onNew?: () => void; creating?: boolean; minimal?: boolean; theme: string; onToggleTheme: () => void }) {
  return (
    <header className="relative z-10 px-6 py-4 flex items-center justify-between glass-soft rounded-b-2xl">
      <Link to="/" className="flex items-center gap-2 font-mono font-bold tracking-tight">
        <div className="w-7 h-7 rounded grid place-items-center bg-primary text-primary-foreground">
          <InboxIcon className="w-4 h-4" />
        </div>
        <span>vanish<span className="text-primary">.mail</span></span>
      </Link>
      <div className="flex items-center gap-2">
        {!minimal && onNew && (
          <button onClick={onNew} disabled={creating} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground font-mono hover:opacity-90 disabled:opacity-50">
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            new
          </button>
        )}
        <button onClick={onToggleTheme} aria-label="toggle theme" className="p-2 rounded-md border border-border hover:bg-card/80 transition glass-soft">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

function Sidebar({ inboxes, activeId }: { inboxes: MailAccount[]; activeId: string | null }) {
  return (
    <aside className="border-r border-border p-3 overflow-y-auto scrollbar-thin glass-panel">
      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2 py-2">
        inboxes · {inboxes.length}
      </div>
      <ul className="space-y-1">
        {inboxes.map((i) => (
          <li key={i.id}>
            <button
              onClick={() => setActiveId(i.id)}
              className={`w-full text-left px-3 py-2 rounded-md font-mono text-sm truncate transition ${
                i.id === activeId ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-card border border-transparent"
              }`}
            >
              {i.address}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

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
    toast.success("Address copied");
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
      <section className="border-r border-border flex flex-col min-h-0 xl:max-h-[calc(100vh-65px)] glass-panel">
        <div className="p-4 border-b border-border">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">your address</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-xl glass-soft text-sm truncate">{account.address}</code>
            <button onClick={copyAddr} className="p-2 rounded-md border border-border hover:bg-card" aria-label="copy">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => refresh()} className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border border-border hover:bg-card">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> refresh
            </button>
            <button onClick={destroy} className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40">
              <Trash2 className="w-3 h-3" /> delete inbox
            </button>
            <span className="ml-auto text-xs font-mono text-muted-foreground inline-flex items-center gap-1.5 pill px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              auto · 5s
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && !messages.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground font-mono">loading…</div>
          ) : messages.length === 0 ? (
            <EmptyInbox />
          ) : (
            <ul>
              {messages.map((m) => {
                const otp = extractOTP(`${m.subject} ${m.intro}`);
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => open(m.id)}
                      className={`w-full text-left p-4 border-b border-border hover:bg-card/60 transition ${
                        selected?.id === m.id ? "bg-card/90" : ""
                      } ${!m.seen ? "" : "opacity-70"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!m.seen && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        <span className="text-sm font-medium truncate">{m.from.name || m.from.address}</span>
                        <span className="ml-auto text-xs font-mono text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: false })}
                        </span>
                      </div>
                      <div className="text-sm truncate">{m.subject || "(no subject)"}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{m.intro}</div>
                      {otp && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold bg-otp text-otp-foreground">
                          OTP {otp}
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

      <section className="hidden xl:flex flex-col min-h-0 max-h-[calc(100vh-65px)] glass-panel">
        {selected ? (
          <MessageView message={selected} onDelete={() => delMsg(selected.id)} />
        ) : (
          <div className="flex-1 grid place-items-center text-muted-foreground font-mono text-sm">
            pick a message to read →
          </div>
        )}
      </section>

      {/* mobile/tablet drawer */}
      {selected && (
        <div className="xl:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur overflow-y-auto">
          <MessageView message={selected} onDelete={() => delMsg(selected.id)} onClose={() => setSelected(null)} />
        </div>
      )}
    </>
  );
}

function MessageView({ message, onDelete, onClose }: { message: MailMessageFull; onDelete: () => void; onClose?: () => void }) {
  const otp = extractOTP(`${message.subject} ${message.text || ""}`);
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-mono font-bold leading-tight">{message.subject || "(no subject)"}</h2>
            <div className="mt-2 text-sm text-muted-foreground">
              from <span className="text-foreground">{message.from.name || message.from.address}</span> · {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </div>
          </div>
          <button onClick={onDelete} className="p-2 rounded-md border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40" aria-label="delete">
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-md border border-border hover:bg-card font-mono text-xs">close</button>
          )}
        </div>
        {otp && (
          <div className="mt-4 p-4 rounded-2xl ring-glow glass-soft flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">verification code</div>
              <div className="font-mono text-3xl font-bold text-primary tracking-[0.2em] mt-1">{otp}</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(otp); toast.success("Code copied"); }}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm font-semibold hover:opacity-90"
            >
              copy
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
        {message.html?.length ? (
          <iframe
            title="message"
            sandbox=""
            srcDoc={`<style>body{color:#fff;font-family:ui-sans-serif,system-ui;background:transparent;margin:0;padding:0;line-height:1.5}a{color:#d4ff00}img{max-width:100%}</style>${message.html.join("")}`}
            className="w-full min-h-[400px] border-0 bg-transparent"
            style={{ colorScheme: "dark" }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{message.text}</pre>
        )}
      </div>
    </div>
  );
}

function EmptyInbox() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full border border-dashed border-border grid place-items-center mb-4">
        <Mail className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="font-mono text-sm">waiting for mail<span className="caret" /></div>
      <div className="text-xs text-muted-foreground mt-2">messages will show up here automatically</div>
    </div>
  );
}
