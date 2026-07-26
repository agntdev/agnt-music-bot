import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { adminPassword, isPanelUnlocked, musicState } from "../music-state.js";

registerMainMenuItem({ label: "🛡 Admin panel", data: "admin:open", order: 90 });
const composer = new Composer<Ctx>();

const passwordPrompt = "Enter the admin password to continue.";
const panelKeyboard = inlineKeyboard([
  [inlineButton("Approve this admin", "admin:approve"), inlineButton("Set alert chat", "admin:alerts")],
  [inlineButton("Welcome message", "admin:welcome"), inlineButton("Security level", "admin:sensitivity")],
  [inlineButton("Change password", "admin:password")],
  [inlineButton("⬅️ Back to menu", "menu:main")],
]);

function showPanelText(): string {
  return "You're in the admin panel. Choose what you'd like to manage.";
}

async function requestPassword(ctx: Ctx, edit = false) {
  const state = musicState(ctx);
  if (!ctx.from) return;
  state.panel ??= {};
  state.panel.awaitingPasswordFor = ctx.from.id;
  state.panel.mode = "login";
  if (edit) await ctx.editMessageText(passwordPrompt); else await ctx.reply(passwordPrompt, { reply_markup: { force_reply: true, input_field_placeholder: "Enter the admin password" } });
}

async function callerIsGroupAdmin(ctx: Ctx): Promise<boolean> {
  if (!ctx.chat || !ctx.from || (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")) return false;
  try {
    const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    return member.status === "creator" || member.status === "administrator";
  } catch {
    return false;
  }
}

composer.command("adminpanel", async (ctx) => requestPassword(ctx));
composer.callbackQuery("admin:open", async (ctx) => { await ctx.answerCallbackQuery(); await requestPassword(ctx, true); });

composer.on("message:text", async (ctx, next) => {
  const state = musicState(ctx);
  if (!ctx.from || state.panel?.awaitingPasswordFor !== ctx.from.id) return next();
  state.panel.awaitingPasswordFor = undefined;
  const mode = state.panel.mode;
  state.panel.mode = undefined;
  if (mode === "welcome") {
    state.welcomeMessage = ctx.message.text.trim();
    await ctx.reply("That welcome message is saved.", { reply_markup: panelKeyboard });
    return;
  }
  if (mode === "password") {
    if (!ctx.message.text.trim()) {
      await ctx.reply("That password is empty. Tap Change password to try again.");
      return;
    }
    state.panel.password = ctx.message.text;
    await ctx.reply("Your admin password is updated.", { reply_markup: panelKeyboard });
    return;
  }
  if (ctx.message.text !== (state.panel.password ?? adminPassword)) {
    await ctx.reply("That password didn't match. Tap Admin panel to try again.");
    return;
  }
  const approved = state.approvedAdmins!.includes(ctx.from.id) || await callerIsGroupAdmin(ctx);
  if (!approved) {
    await ctx.reply("Your account isn't approved for this panel yet. Ask a group owner to approve you from the panel.");
    return;
  }
  state.panel.unlockedFor = [...new Set([...(state.panel.unlockedFor ?? []), ctx.from.id])];
  await ctx.reply(showPanelText(), { reply_markup: panelKeyboard });
});

composer.callbackQuery("admin:approve", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isPanelUnlocked(ctx) || !ctx.from) return ctx.editMessageText("Unlock the admin panel first.");
  const state = musicState(ctx);
  state.approvedAdmins = [...new Set([...state.approvedAdmins!, ctx.from.id])];
  await ctx.editMessageText("This account is approved for the admin panel.", { reply_markup: panelKeyboard });
});
composer.callbackQuery("admin:alerts", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isPanelUnlocked(ctx) || !ctx.chat) return ctx.editMessageText("Unlock the admin panel first.");
  const state = musicState(ctx);
  state.adminGroupId = ctx.chat.id;
  await ctx.editMessageText("Security alerts will be sent to this chat.", { reply_markup: panelKeyboard });
});
composer.callbackQuery("admin:welcome", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isPanelUnlocked(ctx) || !ctx.from) return ctx.editMessageText("Unlock the admin panel first.");
  const state = musicState(ctx);
  state.panel ??= {};
  state.panel.awaitingPasswordFor = ctx.from.id;
  state.panel.mode = "welcome";
  await ctx.editMessageText("Send the welcome message you'd like new members to see.");
});
composer.callbackQuery("admin:sensitivity", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isPanelUnlocked(ctx)) return ctx.editMessageText("Unlock the admin panel first.");
  await ctx.editMessageText("Choose how many security updates to receive.", { reply_markup: inlineKeyboard([[inlineButton("Low", "security:low"), inlineButton("Standard", "security:standard"), inlineButton("High", "security:high")]] ) });
});
composer.callbackQuery("admin:password", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isPanelUnlocked(ctx) || !ctx.from) return ctx.editMessageText("Unlock the admin panel first.");
  const state = musicState(ctx);
  state.panel ??= {};
  state.panel.awaitingPasswordFor = ctx.from.id;
  state.panel.mode = "password";
  await ctx.editMessageText("Send the new admin password. Keep it somewhere safe.");
});
composer.on("callback_query:data", async (ctx, next) => {
  if (!ctx.callbackQuery.data.startsWith("security:")) return next();
  await ctx.answerCallbackQuery();
  if (!isPanelUnlocked(ctx)) return ctx.editMessageText("Unlock the admin panel first.");
  const level = ctx.callbackQuery.data.slice("security:".length);
  if (level !== "low" && level !== "standard" && level !== "high") return ctx.editMessageText("Choose one of the security levels shown.");
  musicState(ctx).securitySensitivity = level;
  await ctx.editMessageText(`Security alerts are set to ${level}.`, { reply_markup: panelKeyboard });
});

export default composer;
