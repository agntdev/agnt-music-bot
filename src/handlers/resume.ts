import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { musicState, trackLine } from "../music-state.js";
const composer = new Composer<Ctx>();
async function resume(ctx: Ctx, edit = false) {
  const playback = musicState(ctx).playback;
  const text = playback.status !== "paused" || !playback.current ? "There isn't a paused track to resume." : `Back to playing: ${trackLine(playback.current)}.`;
  if (playback.status === "paused" && playback.current) playback.status = "playing";
  if (edit) await ctx.editMessageText(text); else await ctx.reply(text);
}
composer.command("resume", async (ctx) => resume(ctx));
composer.callbackQuery("music:resume", async (ctx) => { await ctx.answerCallbackQuery(); await resume(ctx, true); });

export default composer;
