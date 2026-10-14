// Delete auth
const fs = require('fs');
if(fs.existsSync('auth')){ fs.rmSync('auth',{recursive:true}); console.log("Auth deleted"); }
