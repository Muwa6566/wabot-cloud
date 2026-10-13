const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu","Chrome","20.0"],
    })
    sock.ev.on('creds.update', saveCreds)

    if (!sock.authState.creds.registered) {
        const num = "256705991442"
        console.log("Waiting 5s...")
        await new Promise(r => setTimeout(r, 5000))
        try {
            const code = await sock.requestPairingCode(num)
            console.log(`\n\n=== PAIRING CODE FOR ${num}: ${code} ===\n`)
        } catch(e){ console.log('Error', e) }
    }

    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('✅ BOT ONLINE 24/7')
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return
        const txt = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        if (txt.toLowerCase() === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! Cloud bot ONLINE 24/7!' })
        }
    })
}
start()
