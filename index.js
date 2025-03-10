/*
╔═════════════════════════════════╗
║     🛠️ Informasi Script
╠═════════════════════════════════╣
║ 📦 Version   : 4.0
║ 👨‍💻 Developer : Azhari Creative    
║ 🌐 Website   : autoresbot.com   
╚═════════════════════════════════╝

⚠️ Peringatan: SCRIPT INI TIDAK BOLEH DIPERJUALBELIKAN
📌 Pembelian resmi hanya dapat dilakukan di website resmi: https://autoresbot.com
*/

require('module-alias/register');
require('@lib/version');

(async () => {
    try {
        const { getAccessToken } = require('@lib/startup');
        await getAccessToken();
    } catch (err) {
        //console.error('Error dalam proses getAccessToken:', err.message);
    }
})();



