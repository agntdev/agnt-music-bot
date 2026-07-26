import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { musicState } from "../music-state.js";
const composer = new Composer<Ctx>();
composer.command("leave", async (ctx) => {
  const playback = musicState(ctx).playback;
  playback.status = "idle";
  playback.current = undefined;
  playback.queue = [];
  await ctx.reply("I cleared this chat's playback and left the music session.");
});

export default composer;
