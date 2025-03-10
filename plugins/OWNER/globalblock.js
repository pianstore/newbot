const config        = require("@config");
const ApiAutoresbot = require('api-autoresbot');
const api           = new ApiAutoresbot(config.APIKEY);
const reportby      = 'autoresbot';
const key           = ''; // Anda membutuhkan key untuk menggunakan fitur ini.

// Fitur ini khusus untuk menyimpan nomor whatsapp ke dalam database autoresbot
// seperti nomor yang melakukan penipuan,spam,virtex dan tindakan lainnya

// informasi untuk mendapatkan nomor yang telah di laporkan dapat di lihat di https://api.autoresbot.com/api/database/blacklist?number=6288888888888

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 6285246154386*_ | catatannya`
                },
                { quoted: message }
            );
        }

        // Memisahkan konten dan validasi
        const [number, noted] = content.split('|').map(item => item?.trim());
        if (!number || !noted) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format salah. Pastikan menggunakan format:\n\n_💬 _Contoh:_ *${prefix + command} 6285246154386 | catatannya*`
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
        const response = await api.get('/api/database/insert-blacklist', {
            number,
            noted,
            reportby,
            key
        });

        // Cek Respons API
        if (response?.code === 200) {
            await sock.sendMessage(
                remoteJid,
                { text: response.message || "Data berhasil diproses." },
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
    Commands    : ['globalblock'],
    OnlyPremium : false,
    OnlyOwner   : true,
    limitDeduction: 1
};
