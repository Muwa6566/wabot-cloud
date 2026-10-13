const http = require('http');
let latestQR = null;

const server = http.createServer((req, res) => {
  if (latestQR) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(latestQR)}`;
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>SCAN THIS WITH WHATSAPP BUSINESS 256705991442</h1><img src="${qrUrl}" style="width:90vw;max-width:500px;"><p>Refresh page for new QR every 20 sec if expired</p><p>QR updates automatically - keep this page open!</p></body></html>`);
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<h1 style="text-align:center;margin-top:50px">WAITING FOR QR... Refresh in 5 seconds<br>Bot starting... 256705991442</h1><script>setTimeout(()=>location.reload(),3000)</script>`);
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
    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update
        if (qr) {
            latestQR = qr;
            console.log("NEW QR GENERATED - SHOWING ON WEBSITE");
        }
        if (connection === 'open') {
            latestQR = null;
            console.log("BOT CONNECTED! 256705991442 ONLINE 24/7");
        }
    })
}
start()
