import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { commandArgument, musicState, resolveTrack, trackLine } from "../music-state.js";

registerMainMenuItem({ label: "▶️ Play music", data: "music:play", order: 10 });
const composer = new Composer<Ctx>();

async function play(ctx: Ctx, query: string, edit = false) {
  if (!query) {
    const text = "Send a YouTube or Spotify link, or type the song name after /play.";
    if (edit) await ctx.editMessageText(text);
    else await ctx.reply(text);
    return;
  }
  const state = musicState(ctx);
  const track = await resolveTrack(query, ctx.from?.first_name ?? "someone");
  if (state.playback.status === "playing" && state.playback.current) {
    state.playback.queue.push(track);
    const text = `Added to the queue: ${trackLine(track)}.`;
    if (edit) await ctx.editMessageText(text);
    else await ctx.reply(text);
    return;
  }
  state.playback.current = track;
  state.playback.status = "playing";
  const text = `Now playing: ${trackLine(track)}.\n\nMusic playback is ready for the connected voice service.`;
  const markup = inlineKeyboard([[inlineButton("⏸ Pause", "music:pause"), inlineButton("⏭ Skip", "music:skip")]]);
  if (edit) await ctx.editMessageText(text, { reply_markup: markup });
  else await ctx.reply(text, { reply_markup: markup });
}

composer.command("play", async (ctx) => play(ctx, commandArgument(ctx)));
composer.callbackQuery("music:play", async (ctx) => {
  await ctx.answerCallbackQuery();
  await play(ctx, "", true);
});

export default composer;
