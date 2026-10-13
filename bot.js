const http = require('http');
http.createServer((req,res)=>res.end("WABOT IS LIVE - SCAN QR IN LOGS")).listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

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
            console.log("=== QR CODE FOR WHATSAPP BUSINESS ===")
            qrcode.generate(qr, { small: true })
            console.log(qr)
        }
        if (connection === 'open') {
            console.log("BOT CONNECTED SUCCESSFULLY! 256705991442 ONLINE")
        }
    })
}

start()
