import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { musicState, trackLine } from "../music-state.js";
registerMainMenuItem({ label: "📋 Queue", data: "music:queue", order: 20 });
const composer = new Composer<Ctx>();
async function queue(ctx: Ctx, edit = false) {
  const playback = musicState(ctx).playback;
  const text = playback.queue.length === 0 ? "No tracks are waiting — use Play music to add one." : `Up next:\n${playback.queue.map((track, index) => `${index + 1}. ${trackLine(track)}`).join("\n")}`;
  const options = { reply_markup: inlineKeyboard([[inlineButton("🎵 Now playing", "music:now")]]) };
  if (edit) await ctx.editMessageText(text, options); else await ctx.reply(text, options);
}
composer.command("queue", async (ctx) => queue(ctx));
composer.callbackQuery("music:queue", async (ctx) => { await ctx.answerCallbackQuery(); await queue(ctx, true); });

export default composer;
