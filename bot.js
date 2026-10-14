const http = require('http');
let pairCode = null;
let statusMsg = "SWISS AI V4 LOADING...";
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`<html><body style="background:#0a0a0a;color:white;text-align:center;padding:20px;font-family:sans-serif"><h1>🤖 ${statusMsg}</h1>${pairCode?`<div style="background:white;color:black;padding:20px;border-radius:15px;display:inline-block"><h1 style="font-size:50px">${pairCode}</h1><p>WhatsApp > Linked Devices > Link with phone number</p></div>`:`<h2>✅ V4 ONLINE - Owner can use phone too!</h2>`}<p>V4: TikTok + Anime + Music + Contacts</p><script>setTimeout(()=>location.reload(),5000)</script></body></html>`);
});
server.listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function askAI(prompt, isImage=false){
  try{
    if(isImage) return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=512&height=512&seed=${Math.floor(Math.random()*9999)}`;
    const res = await fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'openai',messages:[{role:'system',content:"You are SWISS AI V4, helpful, funny, owner 256705991442 can use WhatsApp normally. Short replies with emojis."},{role:'user',content:prompt}],max_tokens:500})});
    const data = await res.json(); return data.choices?.[0]?.message?.content?.substring(0,1000) || `Hey! ${prompt} 😊 How can I help?`;
  }catch{return `Yo! ${prompt} — I'm Swiss AI V4 🤖`; }
}
async function getTikTok(url){
  try{const r=await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);const j=await r.json(); if(j.code===0) return j.data; return null;}catch{return null;}
}
async function getAnime(name){
  try{const r=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(name)}&limit=1`);const j=await r.json(); return j.data?.[0];}catch{return null;}
}
async function getWaifu(type="waifu"){
  try{const r=await fetch(`https://api.waifu.pics/sfw/${type}`);const j=await r.json(); return j.url;}catch{return null;}
}
async function ytSearch(q){
  try{const r=await fetch(`https://api.safone.tech/api/search/youtube?q=${encodeURIComponent(q)}`);const j=await r.json(); return j.data?.[0] || j.result?.[0];}catch{return null;}
}
async function ytMp3(youtubeUrl){
  try{
    const r=await fetch(`https://api.safone.tech/api/download/youtube/mp3?url=${encodeURIComponent(youtubeUrl)}`);
    const j=await r.json(); return j.data?.downloadUrl || j.data?.url || j.url;
  }catch{return null;}
}

async function start(){
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ["Ubuntu","Chrome","22.04"], markOnlineOnConnect: true })
    sock.ev.on('creds.update', saveCreds)
    if (!sock.authState.creds.registered){ setTimeout(async()=>{try{pairCode=await sock.requestPairingCode("256705991442");statusMsg="PAIRING CODE READY! 🔥";}catch(e){statusMsg="Error: "+e.message;}},3000);} else {statusMsg="SWISS AI V4 ONLINE 🤖";}
    sock.ev.on('connection.update', async(u)=>{const{connection,lastDisconnect}=u; if(connection==='open'){pairCode=null;statusMsg="SWISS AI V4 ONLINE 24/7 - Owner can use phone!";} if(connection==='close' && lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) setTimeout(start,3000);})

    sock.ev.on('messages.upsert', async(m)=>{
        const msg=m.messages[0]; if(!msg.message || msg.key.fromMe) return; // OWNER CAN USE PHONE - Bot ignores your messages
        const from=msg.key.remoteJid; const text=msg.message.conversation || msg.message.extendedTextMessage?.text || msg
