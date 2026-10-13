const http = require('http');
let pairCode = null;
let statusMsg = "SWISS AI STARTING...";

// WEBSITE - ALWAYS WORKS, NO 404!
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html><body style="font-family:sans-serif;text-align:center;padding-top:50px">
    <h1>${statusMsg}</h1>
    ${pairCode? `<h1 style="font-size:70px;background:black;color:white;padding:20px;display:inline-block;border-radius:10px;letter-spacing:8px">${pairCode}</h1><p>WhatsApp > Linked Devices > Link with phone number</p>` : `<p>Bot is running...<br>Refresh to see pairing code if not linked</p>`}
    <p>Time: ${new Date().toLocaleString()}</p>
    <script>setTimeout(()=>location.reload(),4000)</script>
    </body></html>
  `);
});
server.listen(process.env.PORT || 3000, () => console.log("Web server on port " + (process.env.PORT || 3000)));

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function askAI(prompt) {
  try {
    const system = "You are Swiss AI, friendly WhatsApp AI assistant. Answer short and helpful. You are owned by 256705991442.";
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(system + "\nUser: " + prompt)}`);
    const txt = await res.text();
    return txt.substring(0,900);
  } catch (e) { return "AI is thinking... try again in 5 seconds! 🤖"; }
}

async function start() {
    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState('auth')
        const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ["Ubuntu", "Chrome", "22.04"] })
        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered) {
            statusMsg = "GENERATING PAIRING CODE...";
            setTimeout(async () => {
                try { pairCode = await sock.requestPairingCode("256705991442"); statusMsg = "PAIRING CODE READY!"; console.log("CODE: " + pairCode); }
                catch (e) { statusMsg = "Error: " + e.message; console.log(e); }
            }, 3000);
        } else { statusMsg = "SWISS AI ONLINE 🤖 Bot is Connected!"; pairCode = null; }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') { pairCode = null; statusMsg = "SWISS AI ONLINE 🤖 Ready!"; console.log("BOT CONNECTED!"); }
            if (connection === 'close') {
                statusMsg = "Reconnecting...";
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
                if (shouldReconnect) { setTimeout(start, 2000); } else { statusMsg = "LOGGED OUT - Need new pairing code"; pairCode = null; }
            }
        })

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            const from = msg.key.remoteJid
            if (from.includes('status@broadcast')) return
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            if (!text) return
            console.log("MSG: " + text);
            try {
                await sock.sendPresenceUpdate('composing', from);
                let reply = text.toLowerCase() === 'menu'? "🤖 SWISS AI\nJust talk to me! I'm ChatGPT in WhatsApp ✅" : await askAI(text);
                await sock.sendMessage(from, { text: reply });
            } catch (e) { console.log(e); }
        })
    } catch (e) { console.log("Startup error", e); statusMsg = "Error: " + e.message; }
}
start()
