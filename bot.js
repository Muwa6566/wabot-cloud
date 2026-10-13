const http = require('http');
let pairCode = null;
let statusMsg = "STARTING BOT...";

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  if (pairCode) {
    res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center">
    <h1>WHATSAPP PAIRING CODE</h1>
    <h1 style="font-size:80px;letter-spacing:10px;background:black;color:white;padding:20px;border-radius:20px">${pairCode}</h1>
    <h2>Go to WhatsApp Business > Linked Devices > Link a device > Link with phone number</h2>
    <h2>Enter this code: ${pairCode}</h2>
    <p>Code for: 256705991442</p>
    <p>Refresh page if code expired</p>
    </body></html>`);
  } else {
    res.end(`<h1 style="text-align:center;margin-top:100px">${statusMsg}<br>Refresh in 3 sec</h1><script>setTimeout(()=>location.reload(),3000)</script>`);
  }
});
server.listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
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
        statusMsg = "GENERATING PAIRING CODE... Wait 10 sec";
        setTimeout(async () => {
            try {
                pairCode = await sock.requestPairingCode("256705991442");
                statusMsg = "CODE READY!";
                console.log("PAIRING CODE: " + pairCode);
            } catch (e) {
                console.log(e);
                statusMsg = "Error generating code - redeploy";
            }
        }, 5000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update
        if (connection === 'open') {
            pairCode = null;
            statusMsg = "BOT CONNECTED! 256705991442 ONLINE 24/7";
            console.log("BOT CONNECTED SUCCESSFULLY!");
        }
    })
}
start()
