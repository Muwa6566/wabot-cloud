 // SWISS AI V5 - FINAL STABLE - Edit your number at top!
const OWNER_NUMBER = "256705991442"; // <--- CHANGE THIS TO YOUR NUMBER! No + , no space. Example: "256773123456"

const http = require('http');
let pairCode = null;
let statusMsg = "STARTING...";

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
  <html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Swiss V5</title></head>
  <body style="background:#111;color:white;text-align:center;padding:20px;font-family:sans-serif">
  <h1>🤖 ${statusMsg}</h1>
  ${pairCode?`<div style="background:white;color:black;padding:25px;border-radius:20px;display:inline-block;margin:20px"><h2 style="margin:0">YOUR CODE:</h2><h1 style="font-size:55px;letter-spacing:8px;margin:10px">${pairCode}</h1><p>WhatsApp > Linked Devices > Link a Device > Link with phone number > Enter this code</p><p style="color:red">FAST! 20 seconds only! Refresh for new code</p></div>`:`<h2>✅ ONLINE 24/7</h2>`}
  <p>Number: ${OWNER_NUMBER}</p>
  <p>Features: TikTok No WM + Anime + Music + AI</p>
  <p>Owner can use phone too!</p>
  <script>setTimeout(()=>location.reload(), 15000)</script>
  </body></html>
  `);
});
server.listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function getTikTok(url){
  try{
    const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    if(j.code===0) return j.data;
    return null;
  }catch{ return null; }
}

async function startBot(){
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu","Chrome","22.04"],
        markOnlineOnConnect: true
    });
    sock.ev.on('creds.update', saveCreds);

    // PAIRING CODE LOGIC - AUTO REFRESH
    if(!sock.authState.creds.registered){
        statusMsg = "GENERATING CODE FOR "+OWNER_NUMBER+"...";
        async function genCode(){
            if(sock.authState.creds.registered) return;
            try{
                pairCode = await sock.requestPairingCode(OWNER_NUMBER);
                statusMsg = "CODE READY! Enter it FAST!";
                console.log("PAIR CODE: "+pairCode+" FOR NUMBER: "+OWNER_NUMBER);
                setTimeout(genCode, 30000); // new code every 30 sec
            }catch(e){
                statusMsg = "Error: "+e.message;
                console.log(e);
                setTimeout(genCode, 5000);
            }
        }
        setTimeout(genCode, 4000);
    } else {
        statusMsg = "ONLINE 24/7 - "+OWNER_NUMBER;
        pairCode = null;
    }

    sock.ev.on('connection.update', (u)=>{
        const { connection, lastDisconnect } = u;
        if(connection==='open'){
            pairCode = null;
            statusMsg = "✅ ONLINE 24/7 - Owner can use phone!";
            console.log("BOT CONNECTED!");
        }
        if(connection==='close'){
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log("Closed: "+code);
            if(code !== DisconnectReason.loggedOut){
                statusMsg = "Reconnecting...";
                setTimeout(startBot, 3000);
            } else {
                statusMsg = "LOGGED OUT - Need new code - Clear cache & deploy";
            }
        }
    });

    sock.ev.on('messages.upsert', async (m)=>{
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return; // owner can use phone - bot ignores own messages
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";
        if(!text || from.includes('status@broadcast')) return;
        const lower = text.toLowerCase().trim();

        console.log("Msg from "+from+": "+text.slice(0,30));

        // AUTO TIKTOK
        if(text.includes('tiktok.com') || text.includes('vm.tiktok') || text.includes('vt.tiktok')){
            try{
                const url = text.match(/https?:\/\/[^\s]+tiktok[^\s]+/i)?.[0] || text.split(/\s+/).find(w=>w.includes('tiktok'));
                if(url){
                    await sock.sendMessage(from, {text:"⏳ Downloading TikTok No Watermark..."});
                    const data = await getTikTok(url);
                    if(data){
                        if(data.images && data.images.length>0){
                            await sock.sendMessage(from, {text:`📸 Found ${data.images.length} images`});
                            for(let img of data.images.slice(0,5)) await sock.sendMessage(from, {image:{url:img}});
                        } else {
                            const vid = data.hdplay || data.play || data.wmplay;
                            await sock.sendMessage(from, {video:{url:vid}, caption:`🎥 TikTok No Watermark\n@${data.author?.unique_id||''}\n🤖 Swiss V5`});
                        }
                        return;
                    }
                }
            }catch(e){ console.log(e.message); }
        }

        if(lower==='.menu' || lower==='menu'){
            await sock.sendMessage(from, {text:`🤖 *SWISS AI V5 MENU*\n\n🎥 TIKTOK:\nJust send TikTok link - Auto download No WM\n.tiktok https://vm.tiktok.com/xxx\n\n🎌 ANIME:\n.anime naruto\n.waifu\n.neko\n\n🎵 MUSIC:\n.play despacito (search)\n\n📞 CONTACT:\n.owner - Owner vCard\n.getpp - Reply to user or tag\n\n🤖 AI:\n.imagine cute cat\nJust chat!\n\n.ping\n.alive\n\n✅ Owner can use phone while bot works 24/7!`});
            return;
        }
        if(lower==='.ping'){ await sock.sendMessage(from, {text:"🏓 PONG! Swiss V5 Online 24/7 ✅"}); return; }
        if(lower==='.alive'){ await sock.sendMessage(from, {text:`🤖 SWISS V5 ALIVE!\nNumber: ${OWNER_NUMBER}\n✅ TikTok No WM\n✅ Anime\n✅ AI\n✅ 24/7\n✅ Owner can use phone!`}); return; }
        if(lower==='.owner'){ const vcard=`BEGIN:VCARD\nVERSION:3.0\nFN:Swiss Owner\nTEL;type=CELL;waid=${OWNER_NUMBER}:+${OWNER_NUMBER}\nEND:VCARD`; await sock.sendMessage(from, {contacts:{displayName:"Swiss Owner", contacts:[{vcard}]}}); return; }
        if(lower.startsWith('.anime ')){
            const q=text.slice(7); try{ const r=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`); const j=await r.json(); const a=j.data?.[0]; if(a) await sock.sendMessage(from, {image:{url:a.images.jpg.large_image_url}, caption:`🎌 ${a.title}\n⭐ ${a.score} | 📺 ${a.episodes} eps\n${a.synopsis?.slice(0,350)}`}); else await sock.sendMessage(from, {text:"❌ Anime not found"});}catch{ await sock.sendMessage(from, {text:"❌ Error"});} return;
        }
        if(lower==='.waifu' || lower==='.neko'){ try{ const r=await fetch(`https://api.waifu.pics/sfw/${lower==='.neko'?'neko':'waifu'}`); const j=await r.json(); await sock.sendMessage(from, {image:{url:j.url}, caption:`🎌 ${lower} - Swiss V5`}); }catch{} return; }
        if(lower.startsWith('.imagine ')){ const p=text.slice(9); await sock.sendMessage(from, {image:{url:`https://image.pollinations.ai/prompt
