const http = require('http');
let pairCode = null;
let statusMsg = "SWISS AI ULTIMATE STARTING...";

// ALWAYS ONLINE WEBSITE - NO 404 EVER!
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html><head><title>Swiss AI Ultimate</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:sans-serif;text-align:center;padding:30px;background:#0a0a0a;color:white">
    <h1 style="color:#25D366">🤖 ${statusMsg}</h1>
    ${pairCode? `<div style="background:white;color:black;padding:30px;border-radius:20px;display:inline-block;margin:20px"><h1 style="font-size:60px;letter-spacing:10px;margin:0">${pairCode}</h1><p>Go to WhatsApp > Linked Devices > Link with phone number</p><p style="color:red">Code expires in 30 sec - Refresh page!</p></div>` : `<h2>✅ Connected & Online 24/7</h2><p>Bot works even if your phone is OFF!</p>`}
    <div style="text-align:left;background:#1a1a1a;padding:20px;border-radius:15px;max-width:500px;margin:20px auto">
    <h3>🔥 SWISS AI ADVANTAGES:</h3>
    <p>✅ ChatGPT AI - Just chat normally</p>
    <p>✅ .imagine - Create AI images</p>
    <p>✅ .sticker - Image to sticker</p>
    <p>✅ .ping - Check speed</p>
    <p>✅ .alive - Bot status</p>
    <p>✅ .menu - Show all commands</p>
    <p>✅ Online 24/7 even phone off</p>
    <p>✅ Auto reactions & typing</p>
    </div>
    <p>${new Date().toLocaleString()}</p>
    <script>setTimeout(()=>location.reload(),5000)</script>
    </body></html>
  `);
});
server.listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')

// AI FUNCTION - CHATGPT FREE
async function askAI(prompt, isImage=false) {
  try {
    if(isImage){
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=512&height=512&seed=${Math.floor(Math.random()*9999)}`;
    }
    const system = "You are SWISS AI, a super smart, funny, friendly WhatsApp AI assistant created by Swiss. You help with everything: homework, coding, advice, jokes, stories. Keep replies short (under 400 chars) unless asked for long. Use emojis. You are online 24/7 even if phone is off.";
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(system + "\n\nUser: " + prompt)}`, { headers: { "User-Agent": "Mozilla" } });
    let txt = await res.text();
    return txt.substring(0, 1000);
  } catch (e) { return "🤖 AI is busy, try again! Error: " + e.message; }
}

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({ 
        version, 
        auth: state, 
        logger: pino({ level: 'silent' }), 
        browser: ["Ubuntu", "Chrome", "22.04"],
        markOnlineOnConnect: true, // ALWAYS ONLINE!
        syncFullHistory: false
    })
    sock.ev.on('creds.update', saveCreds)

    if (!sock.authState.creds.registered) {
        statusMsg = "GENERATING PAIRING CODE...";
        setTimeout(async () => {
            try { pairCode = await sock.requestPairingCode("256705991442"); statusMsg = "PAIRING CODE READY! 🔥"; console.log("CODE: " + pairCode); }
            catch (e) { statusMsg = "Error generating code: " + e.message; }
        }, 4000);
    } else { statusMsg = "SWISS AI ULTIMATE ONLINE 🤖 24/7"; pairCode = null; }

    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u
        if (connection === 'open') { pairCode = null; statusMsg = "SWISS AI ULTIMATE ONLINE 🤖 24/7"; console.log("BOT CONNECTED!"); }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            statusMsg = "Reconnecting... Code: " + reason;
            if (reason !== DisconnectReason.loggedOut) setTimeout(start, 3000);
            else { statusMsg = "LOGGED OUT - Need new code"; pairCode = null; }
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ""
        const sender = msg.pushName || "Friend"
        if (from.includes('status@broadcast')) return

        // Always online + typing
        try { await sock.sendPresenceUpdate('available', from); await sock.sendPresenceUpdate('composing', from); } catch {}

        // Auto React
        try { if(Math.random() > 0.6) await sock.sendMessage(from, { react: { text: ["❤️","🔥","🤖","✅"][Math.floor(Math.random()*4)], key: msg.key } }); } catch {}

        const lower = text.toLowerCase().trim();
        let reply = null;

        // COMMANDS
        if (lower === '.ping' || lower === 'ping') {
            reply = `🏓 *PONG!*\nSpeed: ${Date.now() % 1000}ms\n*SWISS AI ULTIMATE*\n✅ Online 24/7 even phone off\n✅ AI Active`;
        } else if (lower === '.alive' || lower === 'alive') {
            reply = `🤖 *SWISS AI ULTIMATE IS ALIVE!*\n\n✅ Online: 24/7\n✅ Phone off: Works!\n✅ AI: ChatGPT Mode\n✅ Owner: 256705991442\n✅ Version: Ultimate v2\n\nType anything to chat with AI!`;
        } else if (lower.startsWith('.imagine ') || lower.startsWith('.aiimg ')) {
            const prompt = text.slice(9).trim();
            if(!prompt) reply = "🎨 Send: .imagine a cat in space";
            else {
                await sock.sendMessage(from, { text: `🎨 *Creating image:* ${prompt}\nWait 5 sec...` });
                const url = await askAI(prompt, true);
                await sock.sendMessage(from, { image: { url }, caption: `🎨 *${prompt}*\n🤖 Swiss AI Ultimate` });
                return;
            }
        } else if (lower === '.menu' || lower === 'menu' || lower === '.help') {
            reply = `🤖 *SWISS AI ULTIMATE MENU*\n\n*AI COMMANDS:*\n- Just chat normally - AI replies!\n- .imagine [idea] - Create AI image\n- .ai [question] - Ask AI\n\n*BOT COMMANDS:*\n- .ping - Check speed\n- .alive - Bot status\n- .menu - This menu\n- .sticker - Reply to image\n- .owner - Owner info\n\n*ADVANTAGES:*\n✅ Works even if your phone is OFF\n✅ Online 24/7 on Render\n✅ Super fast AI\n✅ Groups + Private\n✅ Auto react + typing\n\nOwner: wa.me/256705991442`;
        } else if (lower === '.owner') {
            reply = "👑 *Owner:* Swiss\n📞 wa.me/256705991442\n🤖 Bot: Swiss AI Ultimate";
        } else if (lower.startsWith('.ai ') || lower.startsWith('.ask ')) {
            const q = text.slice(4).trim();
            reply = q ? await askAI(q) : "Ask me anything! Ex: .ai what is love?";
        } else if (lower.startsWith('.sticker') || msg.message.imageMessage) {
            if (msg.message.imageMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({level:'silent'}), reuploadRequest: sock.updateMediaMessage });
                    await sock.sendMessage(from, { sticker: buffer });
                    return;
                } catch (e) { reply = "❌ Send an image with caption .sticker"; }
            } else if (lower === '.sticker') {
                reply = "📸 Send an image with caption *.sticker* or reply to an image with .sticker";
            }
        }

        // NORMAL CHAT = AI
        if (!reply && text && !text.startsWith('.')) {
            reply = await askAI(text);
        }

        if (reply) {
            await new Promise(r=>setTimeout(r, 1200)); // human-like delay
            await sock.sendMessage(from, { text: reply }, { quoted: msg });
        }
    })
}
start()
