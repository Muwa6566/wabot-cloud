const http = require('http');
let pairCode = null;
let statusMsg = "STARTING BOT...";

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  if (pairCode) {
    res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center">
    <h1>PAIRING CODE</h1>
    <h1 style="font-size:80px;letter-spacing:10px;background:black;color:white;padding:20px;border-radius:20px">${pairCode}</h1>
    <h2>WhatsApp Business > Linked Devices > Link with phone number</h2>
    <p>Enter code: ${pairCode}</p></body></html>`);
  } else {
    res.end(`<h1 style="text-align:center;margin-top:50px">${statusMsg}<br><br>Bot is Online: Swiss should be active<br>Send hi to 256705991442 to test<br><br>Refresh page</h1><script>setTimeout(()=>location.reload(),3000)</script>`);
  }
});
server.listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "22.04"]
    })
    sock.ev.on('creds.update', saveCreds)
    
    if (!sock.authState.creds.registered) {
        statusMsg = "GENERATING PAIRING CODE...";
        setTimeout(async () => {
            try {
                pairCode = await sock.requestPairingCode("256705991442");
                statusMsg = "CODE READY!";
                console.log("PAIRING CODE: " + pairCode);
            } catch (e) { console.log(e); }
        }, 5000);
    } else {
        statusMsg = "BOT CONNECTED! Swiss is active - Send hi to test";
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            pairCode = null;
            statusMsg = "BOT ONLINE! 256705991442 is replying now!";
            console.log("BOT CONNECTED!");
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) start()
        }
    })

    // MESSAGE REPLY LOGIC - THIS WAS MISSING!
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            
            const from = msg.key.remoteJid
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            
            console.log("Got message: " + text + " from " + from)
            
            // Auto reply
            if (text.toLowerCase().includes("hi") || text.toLowerCase().includes("hello")) {
                await sock.sendMessage(from, { text: "Hello! 👋 I am Swiss bot online 24/7 ✅\n\nHow can I help you today?\n\nType MENU for options" })
            } else if (text.toLowerCase().includes("menu")) {
                await sock.sendMessage(from, { text: "🤖 SWISS BOT MENU\n\n1. Say hi\n2. Ask price\n3. Help\n\nI am online 24/7 on Render!" })
            } else {
                await sock.sendMessage(from, { text: `You said: ${text}\n\nI received your message! Bot is working ✅\n\nType MENU` })
            }
        } catch (e) { console.log(e) }
    })
}
start()
