import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { musicState, trackLine } from "../music-state.js";
const composer = new Composer<Ctx>();
async function skip(ctx: Ctx, edit = false) {
  const playback = musicState(ctx).playback;
  const next = playback.queue.shift();
  playback.current = next;
  playback.status = next ? "playing" : "idle";
  const text = next ? `Now playing: ${trackLine(next)}.` : "The queue is empty, so I stopped playback.";
  if (edit) await ctx.editMessageText(text); else await ctx.reply(text);
}
composer.command("skip", async (ctx) => skip(ctx));
composer.callbackQuery("music:skip", async (ctx) => { await ctx.answerCallbackQuery(); await skip(ctx, true); });

export default composer;
