import { useEffect, useState } from "react";
import {
  Plus, Trash2, RefreshCw, ExternalLink, Key, Check,
  Copy, ToggleLeft, ToggleRight, Activity, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  validateApiKey, createRandomAlias, getAliasOptions,
  createCustomAlias, listAliases, deleteAlias, toggleAlias,
  getAliasActivity,
  type SLAlias, type SLActivity,
} from "@/lib/simplelogin";
import {
  getSLApiKey, setSLApiKey, getSLAliases, setSLAliases,
  addSLAlias, removeSLAlias, setActiveId, getActiveId,
} from "@/lib/inbox-store";
import { formatDistanceToNow } from "date-fns";

/* ════════════════════════════════════════════
   API KEY SETUP SCREEN
════════════════════════════════════════════ */
export function SLSetup({ onDone }: { onDone: () => void }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!key.trim()) return;
    setLoading(true);
    try {
      const info = await validateApiKey(key.trim());
      setSLApiKey(key.trim());
      toast.success(`Connected as ${info.email}`);
      onDone();
    } catch (e: any) {
      toast.error("Invalid API key", { description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start px-6 py-10 max-w-lg">
      <div className="w-10 h-10 rounded-xl grid place-items-center mb-6"
        style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
        <Key className="w-5 h-5 text-cyan" />
      </div>

      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-foreground)" }}>
        Connect SimpleLogin
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--dim)", lineHeight: 1.6 }}>
        SimpleLogin aliases work on Twitter, Google, and most major sites.
        Emails forward to your real inbox — you manage them here.
      </p>

      <div className="w-full space-y-3 mb-6">
        <div className="text-xs mono uppercase tracking-widest mb-2" style={{ color: "var(--dim)" }}>
          how to get your API key
        </div>
        {[
          { n: "1", text: "Sign up free at simplelogin.io" },
          { n: "2", text: "Go to Settings → API Keys" },
          { n: "3", text: "Create a new key and paste it below" },
        ].map((s) => (
          <div key={s.n} className="flex items-start gap-3">
            <span className="mono text-xs w-5 shrink-0 pt-0.5" style={{ color: "var(--cyan)" }}>{s.n}.</span>
            <span className="text-sm" style={{ color: "var(--dim)" }}>{s.text}</span>
          </div>
        ))}
        <a href="https://app.simplelogin.io/dashboard/api-key" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs mt-2"
          style={{ color: "var(--cyan)" }}>
          Open SimpleLogin API Keys <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="w-full">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="sl-xxxxxxxxxxxxxxxxxxxxxxxx"
          className="w-full px-3 py-2.5 rounded-lg text-sm mono mb-3 outline-none"
          style={{
            background: "var(--addr-bg)",
            border: "1px solid var(--addr-border)",
            color: "var(--color-foreground)",
          }}
        />
        <button onClick={submit} disabled={loading || !key.trim()}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm w-full justify-center">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? "verifying…" : "connect account"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ALIAS LIST + MANAGEMENT
════════════════════════════════════════════ */
export function SLPanel() {
  const apiKey = getSLApiKey();
  const [aliases, setAliases] = useState<SLAlias[]>(getSLAliases());
  const [selected, setSelected] = useState<SLAlias | null>(null);
  const [activities, setActivities] = useState<SLActivity[]>([]);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customPrefix, setCustomPrefix] = useState("");
  const [suffixes, setSuffixes] = useState<{ suffix: string; signed_suffix: string }[]>([]);
  const [chosenSuffix, setChosenSuffix] = useState(0);

  // Sync aliases from SL on mount
  useEffect(() => {
    sync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load activities when alias selected
  useEffect(() => {
    if (!selected) return;
    getAliasActivity(apiKey, selected.id)
      .then(setActivities)
      .catch(() => setActivities([]));
  }, [selected, apiKey]);

  async function sync(silent = false) {
    if (!silent) setSyncing(true);
    try {
      const fresh = await listAliases(apiKey);
      setSLAliases(fresh);
      setAliases(fresh);
    } catch (e: any) {
      if (!silent) toast.error("Sync failed", { description: e.message });
    } finally {
      setSyncing(false);
    }
  }

  async function spawnRandom() {
    setCreating(true);
    try {
      const alias = await createRandomAlias(apiKey);
      addSLAlias(alias);
      setAliases(getSLAliases());
      setSelected(alias);
      toast.success("Alias created", { description: alias.email });
    } catch (e: any) {
      toast.error("Failed", { description: e.message });
    } finally {
      setCreating(false); }
  }

  async function openCustom() {
    try {
      const opts = await getAliasOptions(apiKey);
      setSuffixes(opts.suffixes.filter((s) => !s.is_premium));
      setShowCustom(true);
    } catch (e: any) {
      toast.error("Failed to load options", { description: e.message });
    }
  }

  async function spawnCustom() {
    if (!customPrefix.trim() || !suffixes[chosenSuffix]) return;
    setCreating(true);
    try {
      const alias = await createCustomAlias(
        apiKey,
        customPrefix.trim(),
        suffixes[chosenSuffix].signed_suffix,
      );
      addSLAlias(alias);
      setAliases(getSLAliases());
      setSelected(alias);
      setShowCustom(false);
      setCustomPrefix("");
      toast.success("Alias created", { description: alias.email });
    } catch (e: any) {
      toast.error("Failed", { description: e.message });
    } finally {
      setCreating(false);
    }
  }

  async function destroy(alias: SLAlias) {
    if (!confirm(`Delete ${alias.email}? This cannot be undone.`)) return;
    try {
      await deleteAlias(apiKey, alias.id);
      removeSLAlias(alias.id);
      setAliases(getSLAliases());
      if (selected?.id === alias.id) setSelected(null);
      toast.success("Alias deleted");
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message });
    }
  }

  async function toggle(alias: SLAlias) {
    try {
      const res = await toggleAlias(apiKey, alias.id);
      const updated = aliases.map((a) =>
        a.id === alias.id ? { ...a, enabled: res.enabled } : a,
      );
      setSLAliases(updated);
      setAliases(updated);
      if (selected?.id === alias.id) setSelected({ ...alias, enabled: res.enabled });
    } catch (e: any) {
      toast.error("Toggle failed", { description: e.message });
    }
  }

  async function copy(email: string, id: number) {
    await navigator.clipboard.writeText(email);
    setCopied(id);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 1500);
  }

  const activeId = getActiveId();

  return (
    <>
      {/* ── Alias list column ── */}
      <section className="relative z-10 flex flex-col min-h-0 xl:max-h-[calc(100vh-49px)] scrollbar-thin"
        style={{ borderRight: "1px solid var(--sidebar-border)" }}>

        {/* Toolbar */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <div className="mono text-xs mb-3 tracking-widest uppercase" style={{ color: "var(--dim)" }}>
            aliases · {aliases.length}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={spawnRandom} disabled={creating}
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
              {creating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              random
            </button>
            <button onClick={openCustom}
              className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
              <Plus className="w-3 h-3" /> custom
            </button>
            <button onClick={() => sync()}
              className="btn-ghost w-7 h-7 rounded-lg grid place-items-center ml-auto">
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Custom alias form */}
          {showCustom && suffixes.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1">
                <input
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                  placeholder="prefix"
                  className="flex-1 px-2 py-1.5 rounded-md text-xs mono outline-none"
                  style={{ background: "var(--addr-bg)", border: "1px solid var(--addr-border)", color: "var(--color-foreground)" }}
                />
                <select
                  value={chosenSuffix}
                  onChange={(e) => setChosenSuffix(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-md text-xs mono outline-none"
                  style={{ background: "var(--addr-bg)", border: "1px solid var(--addr-border)", color: "var(--color-foreground)" }}>
                  {suffixes.map((s, i) => (
                    <option key={i} value={i}>{s.suffix}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={spawnCustom} disabled={creating || !customPrefix.trim()}
                  className="btn-primary flex-1 py-1.5 rounded-md text-xs">
                  {creating ? "creating…" : "create"}
                </button>
                <button onClick={() => setShowCustom(false)}
                  className="btn-ghost px-3 py-1.5 rounded-md text-xs">
                  cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alias list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {aliases.length === 0 ? (
            <div className="px-5 py-8">
              <div className="mono text-xs" style={{ color: "var(--dim)" }}>
                no aliases yet — create one above
              </div>
            </div>
          ) : (
            <ul>
              {aliases.map((a) => {
                const isSel = selected?.id === a.id;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => { setSelected(a); setActiveId(String(a.id)); }}
                      className={`w-full text-left px-5 py-3.5 transition-all ${isSel ? "msg-active" : ""}`}
                      style={{
                        borderBottom: "1px solid var(--glass-border)",
                        borderLeft: isSel ? undefined : "2px solid transparent",
                        opacity: a.enabled ? 1 : 0.45,
                      }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "var(--row-hover)"; }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = ""; }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs mono truncate font-medium" style={{ color: "var(--color-foreground)" }}>
                          {a.email}
                        </span>
                        {!a.enabled && (
                          <span className="mono text-xs shrink-0" style={{ color: "var(--dim)" }}>off</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="mono text-xs" style={{ color: "var(--dim)" }}>
                          {a.nb_forward} fwd
                        </span>
                        <span className="mono text-xs" style={{ color: "var(--dim)" }}>
                          {formatDistanceToNow(new Date(a.creation_timestamp * 1000), { addSuffix: false })} ago
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── Alias detail column ── */}
      <section className="relative z-10 hidden xl:flex flex-col min-h-0 max-h-[calc(100vh-49px)]"
        style={{ background: "var(--color-background)" }}>
        {selected ? (
          <AliasDetail
            alias={selected}
            activities={activities}
            onCopy={copy}
            copied={copied}
            onToggle={toggle}
            onDelete={destroy}
          />
        ) : (
          <div className="flex-1 flex flex-col items-start justify-end px-6 pb-10">
            <div className="mono text-xs tracking-widest uppercase mb-2" style={{ color: "var(--dim)", opacity: 0.4 }}>
              no alias selected
            </div>
          </div>
        )}
      </section>

      {/* Mobile detail drawer */}
      {selected && (
        <div className="xl:hidden fixed inset-0 z-50 overflow-y-auto drawer-enter"
          style={{ background: "var(--color-background)" }}>
          <AliasDetail
            alias={selected}
            activities={activities}
            onCopy={copy}
            copied={copied}
            onToggle={toggle}
            onDelete={destroy}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </>
  );
}

/* ── Alias detail ── */
function AliasDetail({ alias, activities, onCopy, copied, onToggle, onDelete, onClose }: {
  alias: SLAlias;
  activities: SLActivity[];
  onCopy: (email: string, id: number) => void;
  copied: number | null;
  onToggle: (a: SLAlias) => void;
  onDelete: (a: SLAlias) => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full detail-enter">
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="mono text-xs tracking-widest uppercase mb-1" style={{ color: "var(--dim)" }}>
              alias address
            </div>
            <div className="mono text-sm font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
              {alias.email}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onClose && (
              <button onClick={onClose} className="btn-ghost px-3 py-1.5 rounded-lg text-xs">esc</button>
            )}
            <button onClick={() => onDelete(alias)}
              className="btn-ghost w-7 h-7 rounded-lg grid place-items-center"
              style={{ color: "var(--color-destructive)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onCopy(alias.email, alias.id)}
            className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ color: copied === alias.id ? "var(--cyan)" : undefined }}>
            {copied === alias.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === alias.id ? "copied" : "copy"}
          </button>
          <button onClick={() => onToggle(alias)}
            className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            {alias.enabled
              ? <ToggleRight className="w-3.5 h-3.5" style={{ color: "var(--green)" }} />
              : <ToggleLeft className="w-3.5 h-3.5" />}
            {alias.enabled ? "enabled" : "disabled"}
          </button>
          <a href="https://app.simplelogin.io" target="_blank" rel="noopener noreferrer"
            className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ml-auto">
            open inbox <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "forwarded", val: alias.nb_forward },
            { label: "blocked",   val: alias.nb_block },
            { label: "replied",   val: alias.nb_reply },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg font-bold mono" style={{ color: "var(--color-foreground)" }}>{s.val}</div>
              <div className="mono text-xs" style={{ color: "var(--dim)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="px-6 py-4 mx-6 mt-5 rounded-xl"
        style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)" }}>
        <div className="mono text-xs tracking-widest uppercase mb-1" style={{ color: "var(--cyan)" }}>
          how this works
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--dim)" }}>
          Emails sent to this alias are forwarded to your real inbox by SimpleLogin.
          Use the address above when signing up on any site — it works on Twitter, Google, and everywhere else.
          Click "open inbox" to read forwarded emails in SimpleLogin's web app.
        </p>
      </div>

      {/* Activity feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
        <div className="mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--dim)" }}>
          recent activity
        </div>
        {activities.length === 0 ? (
          <div className="mono text-xs" style={{ color: "var(--dim)", opacity: 0.5 }}>
            no activity yet — share this alias to start receiving emails
          </div>
        ) : (
          <ul className="space-y-3">
            {activities.map((act, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mono text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{
                    background: act.action === "forward" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                    color: act.action === "forward" ? "var(--green)" : "var(--color-destructive)",
                    border: `1px solid ${act.action === "forward" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                  }}>
                  {act.action}
                </span>
                <div className="min-w-0">
                  <div className="text-xs truncate" style={{ color: "var(--color-foreground)" }}>
                    {act.from}
                  </div>
                  <div className="mono text-xs" style={{ color: "var(--dim)" }}>
                    {formatDistanceToNow(new Date(act.timestamp * 1000), { addSuffix: true })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
