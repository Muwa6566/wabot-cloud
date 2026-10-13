const http = require('http');
let pairCode = null;
let statusMsg = "SWISS AI STARTING...";

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  if (pairCode) {
    res.end(`<h1 style="text-align:center">CODE: <span style="font-size:60px;background:black;color:white;padding:15px">${pairCode}</span><br><br>Enter in WhatsApp Business > Link with phone number</h1>`);
  } else {
    res.end(`<h1 style="text-align:center;margin-top:100px">${statusMsg}<br><br>Swiss AI is Online 🤖</h1><script>setTimeout(()=>location.reload(),3000)</script>`);
  }
});
server.listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function askAI(prompt) {
  try {
    // Free AI API - no key needed!
    const system = "You are Swiss AI, a friendly, helpful, smart WhatsApp assistant. You reply short, fun, and helpful. Your owner is 256705991442. Be like ChatGPT but cooler.";
    const fullPrompt = system + "\nUser: " + prompt + "\nSwiss AI:";
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`);
    const text = await res.text();
    return text.slice(0, 1000); // limit to 1000 chars for WhatsApp
  } catch (e) {
    console.log("AI error", e);
    return "Sorry, my AI brain is sleeping 😴 Try again!";
  }
}

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ["Ubuntu", "Chrome", "22.04"] })
    sock.ev.on('creds.update', saveCreds)
    
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try { pairCode = await sock.requestPairingCode("256705991442"); console.log("CODE: " + pairCode); } catch (e) { console.log(e); }
        }, 4000);
    } else { statusMsg = "SWISS AI ONLINE 🤖 Ready to chat!"; }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') { pairCode = null; statusMsg = "SWISS AI ONLINE 🤖 Send hi!"; console.log("BOT CONNECTED!"); }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) start()
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            const from = msg.key.remoteJid
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            if (!text) return

            console.log(`Got message: ${text} from ${from}`);

            // Don't reply to status
            if (from.includes('status@broadcast')) return;

            // Typing...
            await sock.sendPresenceUpdate('composing', from);

            let reply = "";
            const lower = text.toLowerCase();

            if (lower === 'menu' || lower === 'help') {
                reply = `🤖 *SWISS AI MENU*\n\nJust talk to me like ChatGPT!\n\nExamples:\n• "Write a business plan"\n• "Explain crypto"\n• "Roast me"\n• "Translate to Luganda"\n• "Give me pickup line"\n\nI am AI 24/7 ✅`;
            } else {
                // ASK AI!
                reply = await askAI(text);
            }

            await sock.sendMessage(from, { text: reply });
            console.log("Replied: " + reply);

        } catch (e) { console.log("Message error", e) }
    })
}
start()
