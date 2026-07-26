import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { musicState } from "../music-state.js";
const composer = new Composer<Ctx>();
async function pause(ctx: Ctx, edit = false) {
  const playback = musicState(ctx).playback;
  const text = playback.status !== "playing" ? "Nothing is playing right now." : "Paused. Tap Resume when you're ready.";
  if (playback.status === "playing") playback.status = "paused";
  const options = { reply_markup: inlineKeyboard([[inlineButton("▶️ Resume", "music:resume")]]) };
  if (edit) await ctx.editMessageText(text, options); else await ctx.reply(text, options);
}
composer.command("pause", async (ctx) => pause(ctx));
composer.callbackQuery("music:pause", async (ctx) => { await ctx.answerCallbackQuery(); await pause(ctx, true); });

export default composer;
