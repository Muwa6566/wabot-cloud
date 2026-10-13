const http = require('http');
http.createServer((req,res)=>res.end("WABOT LIVE - CHECK LOGS FOR QR LINK")).listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ["Ubuntu", "Chrome", "22.04"]
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update
        if (qr) {
            console.log("=== COPY THIS LINK TO BROWSER TO SEE BIG QR ===")
            console.log(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`)
            console.log("=== QR STRING END ===")
        }
        if (connection === 'open') {
            console.log("BOT CONNECTED! 256705991442 ONLINE 24/7")
        }
    })
}

start()
