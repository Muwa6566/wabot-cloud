const OWNER_NUMBER = "256705991442"; // CHANGE TO YOUR NUMBER!

const http = require('http');
let pairCode = null;
let statusMsg = "STARTING...";

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`<html><body style="background:#000;color:#fff;text-align:center;padding:20px;font-family:sans-serif"><h1>${statusMsg}</h1>${pairCode?`<div style="background:#fff;color:#000;padding:20px;border-radius:15px;display:inline-block"><h1 style="font-size:50px;letter-spacing:5px">${pairCode}</h1><p>Link: WhatsApp > Linked Devices > Link with phone number</p><p style="color:red">Enter fast! 20 sec!</p></div>`:`<h2>ONLINE</h2>`}<p>Number: ${OWNER_NUMBER}</p><script>setTimeout(()=>location.reload(),10000)</script></body></html>`);
});
server.listen(process.env.PORT || 3000, ()=>console.log("Web on"));

async function start(){
  const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
  const pino = require('pino');
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({version, auth: state, logger: pino({level:'silent'}), browser: ["Ubuntu","Chrome","22.04"]});
  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
    statusMsg = "Generating code for "+OWNER_NUMBER;
    const gen = async()=>{
      if(sock.authState.creds.registered) return;
      try{
        pairCode = await sock.requestPairingCode(OWNER_NUMBER);
        statusMsg = "CODE READY! "+pairCode;
        console.log("CODE: "+pairCode);
        setTimeout(gen, 30000);
      }catch(e){
        console.log("Code error:", e.message);
        statusMsg = "Error: "+e.message;
        setTimeout(gen, 5000);
      }
    };
    setTimeout(gen, 3000);
  } else {
    statusMsg = "ONLINE 24/7";
    pairCode = null;
  }

  sock.ev.on('connection.update', (u)=>{
    const {connection, lastDisconnect} = u;
    if(connection==='open'){ statusMsg="ONLINE 24/7"; pairCode=null; console.log("CONNECTED!");}
    if(connection==='close'){
      const c = lastDisconnect?.error?.output?.statusCode;
      console.log("Close code:", c);
      if(c!==DisconnectReason.loggedOut) setTimeout(start, 3000);
    }
  });

  sock.ev.on('messages.upsert', async (m)=>{
    const msg=m.messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const from=msg.key.remoteJid;
    const text=msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if(!text) return;
    console.log("Got:", text);
    if(text.toLowerCase()==='.ping'){ await sock.sendMessage(from, {text:"PONG! Swiss V5 Online ✅"}); }
    if(text.toLowerCase()==='.menu'){ await sock.sendMessage(from, {text:"MENU:.ping.alive.owner\nTikTok: send link\nAnime:.anime naruto.waifu"}); }
    if(text.toLowerCase()==='.alive'){ await sock.sendMessage(from, {text:"Swiss V5 ALIVE 24/7"}); }
  });
}

start();
