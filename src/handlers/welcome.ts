import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { musicState } from "../music-state.js";

const composer = new Composer<Ctx>();

composer.on("message:new_chat_members", async (ctx) => {
  const state = musicState(ctx);
  const template = state.welcomeMessage ?? "Welcome, {name}! Glad you're here.";
  for (const member of ctx.message.new_chat_members) {
    if (member.is_bot) continue;
    await ctx.reply(template.replace("{name}", member.first_name));
  }
});

export default composer;
