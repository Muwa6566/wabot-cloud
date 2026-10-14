const http = require('http');
let pairCode = null;
let statusMsg = "SWISS AI V4.1 STARTING...";

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`<html><body style="background:#0a0a0a;color:white;text-align:center;padding:20px;font-family:sans-serif"><h1>🤖 ${statusMsg}</h1>${pairCode?`<div style="background:white;color:black;padding:20px;border-radius:15px;display:inline-block"><h1 style="font-size:50px;letter-spacing:5px">${pairCode}</h1><p>WhatsApp > Linked Devices > Link with phone number</p><p>Refresh after 30 sec</p></div>`:`<h2>✅ V4.1 ONLINE 24/7</h2><p>Owner can use phone too!</p>`}<p>Features: TikTok No WM + Anime + Music + AI</p><script>setTimeout(()=>location.reload(),8000)</script></body></html>`);
});
server.listen(process.env.PORT || 3000, ()=>console.log("Web server live"));

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function askAI(prompt){
  try{
    const r = await fetch('https://text.pollinations.ai/openai', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({model:'openai', messages:[{role:'system', content:"You are SWISS AI V4, friendly helpful, owner 256705991442"}, {role:'user', content:prompt}], max_tokens:400 })
    });
    const j = await r.json();
    return j.choices?.[0]?.message?.content?.slice(0,900) || "Hey! How can I help? 🤖";
  }catch(e){ return `Hi! You said "${prompt}" - I'm Swiss AI 🤖`; }
}

async function start(){
    try{
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ["Ubuntu","Chrome","22.04"], markOnlineOnConnect: true })
    sock.ev.on('creds.update', saveCreds)

    if (!sock.authState.creds.registered){
        statusMsg="GENERATING PAIRING CODE...";
        setTimeout(async()=>{
            try{ pairCode = await sock.requestPairingCode("256705991442"); statusMsg="PAIRING CODE READY! 🔥"; console.log("PAIR CODE: "+pairCode);}
            catch(e){ statusMsg="Error: "+e.message; console.log(e); }
        }, 5000);
    } else { statusMsg="SWISS AI V4.1 ONLINE 24/7 🤖"; pairCode=null; }

    sock.ev.on('connection.update', async(u)=>{
        const { connection, lastDisconnect } = u;
        if(connection==='open'){ pairCode=null; statusMsg="SWISS AI V4.1 ONLINE 24/7 🤖"; console.log("CONNECTED!"); }
        if(connection==='close'){
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log("Closed code:", code);
            if(code!== DisconnectReason.loggedOut){ statusMsg="Reconnecting..."; setTimeout(start, 3000); }
            else { statusMsg="LOGGED OUT - Need new code"; }
        }
    })

    sock.ev.on('messages.upsert', async(m)=>{
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
        if(!text || from.includes('status@broadcast')) return;
        const lower = text.toLowerCase().trim();

        // TIKTOK NO WATERMARK
        if(text.includes('tiktok.com')){
            try{
                const url = text.match(/https?:\/\/[^\s]+tiktok[^\s]+/)?.[0] || text;
                await sock.sendMessage(from,{text:"⏳ Downloading TikTok No Watermark..."});
                const api = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                const json = await api.json();
                if(json.code===0){
                    const d=json.data;
                    if(d.images){ for(let img of d.images.slice(0,4)) await sock.sendMessage(from,{image:{url:img}}); }
                    else { await sock.sendMessage(from,{video:{url:d.hdplay||d.play}, caption:`🎥 No Watermark @${d.author?.unique_id||''}\n🤖 Swiss V4.1`}); }
                    return;
                }
            }catch(e){ console.log("TikTok err",e.message); }
        }

        // ANIME
        if(lower.startsWith('.anime ')){
            const q=text.slice(7); try{ const r=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`); const j=await r.json(); const a=j.data?.[0]; if(a) await sock.sendMessage(from,{image:{url:a.images.jpg.large_image_url}, caption:`🎌 ${a.title}\n⭐ ${a.score}\n📺 ${a.episodes} eps\n${a.synopsis?.slice(0,300)}`}); else await sock.sendMessage(from,{text:"❌ Not found"});}catch{ await sock.sendMessage(from,{text:"❌ Anime error"});} return;
        }
        if(lower==='.waifu' || lower==='.neko'){
            try{ const r=await fetch(`https://api.waifu.pics/sfw/${lower==='.neko'?'neko':'waifu'}`); const j=await r.json(); await sock.sendMessage(from,{image:{url:j.url}, caption:`🎌 ${lower} - Swiss V4.1`}); }catch{} return;
        }

        // MUSIC.play
        if(lower.startsWith('.play ')||lower.startsWith('.song ')){
            const q=text.split(' ').slice(1).join(' '); await sock.sendMessage(from,{text:`🎵 Searching: ${q} - Use YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(q)}\n\nTo download MP3, send TikTok music link or YouTube link with.tiktok`}); return;
        }

        // CONTACTS
        if(lower==='.owner'){ const vcard=`BEGIN:VCARD\nVERSION:3.0\nFN:Swiss Owner\nTEL;type=CELL;waid=256705991442:+256705991442\nEND:VCARD`; await sock.sendMessage(from,{contacts:{displayName:"Swiss Owner", contacts:[{vcard}]}}); return; }
        if(lower==='.getpp'){ try{ const jid=msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]||from; const url=await sock.profilePictureUrl(jid,'image'); await sock.sendMessage(from,{image:{url}, caption:`🖼️ PP of ${jid}`}); }catch{ await sock.sendMessage(from,{text:"❌ No PP"});} return; }

        if(lower==='.menu'){ await sock.sendMessage(from,{text:`🤖 *V4.1 MENU*\n\n🎥.tiktok - Send TikTok link (No WM)\n🎌.anime naruto\n🎌.waifu /.neko\n🎵.play song name\n📞.owner /.getpp @user\n🤖.imagine cat\n💬 Just chat - AI replies!\n✅ Owner can use phone too - Bot ignores your own messages!`}); return;}
        if(lower==='.ping'){ await sock.sendMessage(from,{text:"🏓 PONG! Online 24/7 even phone off ✅"}); return;}
        if(lower==='.alive'){ await sock.sendMessage(from,{text:"🤖 SWISS AI V4.1 ALIVE! TikTok+Anime+Music+AI + Owner Mode"}); return;}
        if(lower.startsWith('.imagine ')){ const p=text.slice(9); await sock.sendMessage(from,{image:{url:`https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?nologo=true`}, caption:`🎨 ${p}`}); return;}

        // AI
        if(text &&!text.startsWith('.')){
            const reply = await askAI(text);
            await sock.sendMessage(from,{text:reply},{quoted:msg});
        }
    })
    }catch(err){ console.log("Start error:", err); statusMsg="Error: "+err.message; setTimeout(start,5000); }
}
start()
