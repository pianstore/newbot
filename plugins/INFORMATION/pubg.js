const ApiAutoresbot = require('api-autoresbot');
const config = require('@config');
const { logCustom }     = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_Masukkan ID GAME_\n\n${prefix + command} 5178789962` },
                { quoted: message }
            );
        }

        const user_id = trimmedContent;
        if (!user_id) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Format salah. Gunakan:_\n\n${prefix + command} <user_id>` },
                { quoted: message }
            );
        }

        // Mengirimkan reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API
        const response = await api.get('/api/checker/pubg-mobile', { user_id });

        if (response?.data) {
            const { username } = response.data;

            const gameDataId = `🎮 | *PUBG MOBILE*

◧ User ID : ${user_id}
◧ Username : ${username || 'Tidak diketahui'}`;

            // Mengirimkan data yang diperoleh
            await sock.sendMessage(remoteJid, { text: gameDataId }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Respons kosong atau tidak ada data
            await sock.sendMessage(remoteJid, { text: 'Maaf, tidak ada respons dari server.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Penanganan kesalahan dengan pesan ke pengguna
        await sock.sendMessage(
            remoteJid,
            { text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\nDetail: ${error.message || error}` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['pubgcek'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction: 1
};
