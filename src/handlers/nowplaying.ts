import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { musicState, trackLine } from "../music-state.js";
const composer = new Composer<Ctx>();
async function nowPlaying(ctx: Ctx, edit = false) {
  const playback = musicState(ctx).playback;
  const text = playback.current ? `${playback.status === "paused" ? "Paused" : "Now playing"}: ${trackLine(playback.current)}.` : "Nothing is playing yet — tap Play music to choose a track.";
  if (edit) await ctx.editMessageText(text); else await ctx.reply(text);
}
composer.command("nowplaying", async (ctx) => nowPlaying(ctx));
composer.callbackQuery("music:now", async (ctx) => { await ctx.answerCallbackQuery(); await nowPlaying(ctx, true); });

export default composer;
