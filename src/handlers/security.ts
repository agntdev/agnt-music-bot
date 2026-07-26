import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { now } from "../clock.js";
import { musicState } from "../music-state.js";

const composer = new Composer<Ctx>();

function eventDescription(ctx: Ctx): { type: string; details: string } | undefined {
  const change = ctx.chatMember;
  if (!change) return undefined;
  const before = change.old_chat_member.status;
  const after = change.new_chat_member.status;
  const name = change.new_chat_member.user.first_name;
  if (after === "kicked" || after === "restricted") return { type: "moderation", details: `${name}'s access changed from ${before} to ${after}.` };
  if ((before === "left" || before === "kicked") && after === "member") return { type: "join", details: `${name} joined the chat.` };
  if (before === "member" && after === "left") return { type: "leave", details: `${name} left the chat.` };
  return undefined;
}

composer.on("chat_member", async (ctx) => {
  const event = eventDescription(ctx);
  if (!event) return;
  const state = musicState(ctx);
  if (state.securitySensitivity === "low" && event.type !== "moderation") return;
  const record = { type: event.type, at: now().toISOString(), chatId: ctx.chat.id, details: event.details };
  state.alerts!.push(record);
  if (!state.adminGroupId) return;
  try {
    await ctx.api.sendMessage(state.adminGroupId, `Security alert: ${event.details}`);
  } catch {
    // Alerts are best-effort: a blocked or removed admin chat must not break moderation updates.
  }
});

export default composer;
