const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const cleanHtml = (input) => input.replace(/<\/?[^>]+(>|$)/g, "");

async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validasi input
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} pohon*_`);
        }

        // Tampilkan reaksi "Loading"
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Inisialisasi API
        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API dengan parameter
        const response = await api.get('/api/information/kbbi', { q: content });

        // Menangani respons API
        if (response.code === 200 && response.data) {
            const { kata, keterangan } = response.data;
            const bersih = cleanHtml(keterangan);
            const kbbiData = `_*Kata:*_ ${kata}\n\n_*Arti:*_ ${bersih}`;

            // Kirimkan text
            await sendMessageWithQuote(sock, remoteJid, message, kbbiData);
        } else {
            // Menangani kasus jika respons tidak sesuai atau kosong
            const errorMessage = response?.message || "Maaf, tidak ada respons dari server. Silakan coba lagi nanti.";
            await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
        }
    } catch (error) {
        console.error("Kesalahan saat memanggil API Autoresbot:", error);

        // Menangani kesalahan dan mengirim pesan ke pengguna
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\nDetail Error: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['kbbi'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1 
};
