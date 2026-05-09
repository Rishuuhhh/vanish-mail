// SimpleLogin API client — https://simplelogin.io/docs/api/
// Aliases created here forward to the user's real mailbox.
// Emails are NOT readable in-app — they land in the user's real inbox.

const API = "https://app.simplelogin.io";

export interface SLAlias {
  id: number;
  email: string;
  enabled: boolean;
  creation_timestamp: number;
  nb_forward: number;
  nb_block: number;
  nb_reply: number;
  note: string | null;
}

export interface SLActivity {
  action: "forward" | "reply" | "block" | "bounced";
  from: string;
  to: string;
  timestamp: number;
}

async function req<T>(
  path: string,
  apiKey: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authentication: apiKey,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `SimpleLogin ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Validate an API key and return user info */
export async function validateApiKey(
  apiKey: string,
): Promise<{ name: string; email: string; is_premium: boolean }> {
  return req("/api/user_info", apiKey);
}

/** Get available suffix options for alias creation */
export async function getAliasOptions(apiKey: string): Promise<{
  can_create: boolean;
  suffixes: { suffix: string; signed_suffix: string; is_premium: boolean }[];
}> {
  return req("/api/v5/alias/options", apiKey);
}

/** Create a random alias */
export async function createRandomAlias(
  apiKey: string,
  note?: string,
): Promise<SLAlias> {
  return req("/api/alias/random/new", apiKey, {
    method: "POST",
    body: JSON.stringify({ note: note ?? "Created via vanish.mail" }),
  });
}

/** Create a custom alias with a chosen prefix */
export async function createCustomAlias(
  apiKey: string,
  prefix: string,
  signedSuffix: string,
  note?: string,
): Promise<SLAlias> {
  // Get default mailbox id first
  const mailboxes = await req<{ mailboxes: { id: number; default: boolean }[] }>(
    "/api/v2/mailboxes",
    apiKey,
  );
  const defaultMailbox = mailboxes.mailboxes.find((m) => m.default);
  if (!defaultMailbox) throw new Error("No default mailbox found");

  return req("/api/v3/alias/custom/new", apiKey, {
    method: "POST",
    body: JSON.stringify({
      alias_prefix: prefix,
      signed_suffix: signedSuffix,
      mailbox_ids: [defaultMailbox.id],
      note: note ?? "Created via vanish.mail",
    }),
  });
}

/** List all aliases */
export async function listAliases(apiKey: string): Promise<SLAlias[]> {
  const data = await req<{ aliases: SLAlias[] }>(
    "/api/v2/aliases?page_id=0&enabled=true",
    apiKey,
  );
  return data.aliases;
}

/** Get recent activity for an alias */
export async function getAliasActivity(
  apiKey: string,
  aliasId: number,
): Promise<SLActivity[]> {
  const data = await req<{ activities: SLActivity[] }>(
    `/api/aliases/${aliasId}/activities?page_id=0`,
    apiKey,
  );
  return data.activities;
}

/** Delete an alias */
export async function deleteAlias(
  apiKey: string,
  aliasId: number,
): Promise<void> {
  await req(`/api/aliases/${aliasId}`, apiKey, { method: "DELETE" });
}

/** Toggle alias on/off */
export async function toggleAlias(
  apiKey: string,
  aliasId: number,
): Promise<{ enabled: boolean }> {
  return req(`/api/aliases/${aliasId}/toggle`, apiKey, { method: "POST" });
}
