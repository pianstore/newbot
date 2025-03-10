const config        = require("@config");
const ApiAutoresbot = require('api-autoresbot');
const api           = new ApiAutoresbot(config.APIKEY);
const key           = ''; // Anda membutuhkan key untuk menggunakan fitur ini.

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} ID*_`
                },
                { quoted: message }
            );
        }

        if (!key) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Key diperlukan untuk menggunakan fitur_`
                },
                { quoted: message }
            );
        }

        

        // Loading Reaction
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        
        // Memanggil API
        const response = await api.get('/api/database/delete-blacklist', {
            id : content,
            key
        });

        // Cek Respons API
        if (response?.code === 200) {
            await sock.sendMessage(
                remoteJid,
                { text: response.message || "Data berhasil di hapus." },
                { quoted: message }
            );
        } else {
            await sock.sendMessage(
                remoteJid,
                { text: response?.message || "Maaf, tidak ada respons dari server." },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error saat memproses:", error);
        await sock.sendMessage(
            remoteJid,
            {
                text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.\n\n*Detail Error:*\n${error.message}`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['globalunblock'],
    OnlyPremium : false,
    OnlyOwner   : true,
    limitDeduction: 1
};
