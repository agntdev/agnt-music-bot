import type { Ctx } from "./bot.js";

export type PlaybackStatus = "playing" | "paused" | "idle";

export interface Track {
  title: string;
  source: "youtube" | "spotify" | "search";
  url?: string;
  requestedBy: string;
}

export interface MusicState {
  playback: { status: PlaybackStatus; current?: Track; queue: Track[] };
  panel?: { awaitingPasswordFor?: number; unlockedFor?: number[]; password?: string; mode?: "login" | "welcome" | "password" };
  users?: Record<string, { id: number; username: string }>;
  chat?: { id: number; title: string };
  welcomeMessage?: string;
  securitySensitivity?: "low" | "standard" | "high";
  adminGroupId?: number;
  approvedAdmins?: number[];
  alerts?: Array<{ type: string; at: string; chatId: number; details: string }>;
}

function state(ctx: Ctx): MusicState {
  const session = ctx.session as MusicState;
  session.playback ??= { status: "idle", queue: [] };
  session.users ??= {};
  session.approvedAdmins ??= [];
  session.alerts ??= [];
  session.securitySensitivity ??= "standard";
  return session;
}

export function musicState(ctx: Ctx): MusicState {
  const value = state(ctx);
  if (ctx.from) {
    value.users![String(ctx.from.id)] = {
      id: ctx.from.id,
      username: ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name,
    };
  }
  if (ctx.chat) {
    value.chat = { id: ctx.chat.id, title: "title" in ctx.chat ? (ctx.chat.title ?? "This chat") : ctx.chat.first_name };
  }
  return value;
}

export function commandArgument(ctx: Ctx): string {
  const text = ctx.message?.text ?? "";
  return text.replace(/^\/[A-Za-z0-9_]+(?:@\w+)?\s*/, "").trim();
}

export function makeTrack(query: string, requestedBy: string): Track {
  const url = /^https?:\/\//i.test(query) ? query : undefined;
  const source: Track["source"] = /spotify\.com/i.test(query)
    ? "spotify"
    : /(?:youtube\.com|youtu\.be)/i.test(query)
      ? "youtube"
      : "search";
  return { title: query, source, url, requestedBy };
}

/** Resolve link metadata with the public provider oEmbed contracts. A failed
 * lookup deliberately keeps the submitted link as its label, so playback state
 * remains useful during a provider outage without inventing a track title. */
export async function resolveTrack(query: string, requestedBy: string): Promise<Track> {
  const track = makeTrack(query, requestedBy);
  if (!track.url || track.source === "search") return track;
  const endpoint = track.source === "youtube"
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(track.url)}&format=json`
    : `https://open.spotify.com/oembed?url=${encodeURIComponent(track.url)}`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return track;
    const body = (await response.json()) as { title?: unknown };
    if (typeof body.title === "string" && body.title.trim()) track.title = body.title.trim();
  } catch {
    // Provider metadata is optional; the original URL is an honest fallback.
  }
  return track;
}

export function trackLine(track: Track): string {
  return track.title;
}

export function isPanelUnlocked(ctx: Ctx): boolean {
  const value = musicState(ctx);
  return Boolean(ctx.from && value.panel?.unlockedFor?.includes(ctx.from.id));
}

export const adminPassword = "@bhaskarsinha10112010";
