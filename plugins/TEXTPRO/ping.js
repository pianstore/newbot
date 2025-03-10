const axios = require('axios');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;
    const domain = "https://www.google.com";

    try {

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Mencatat waktu sebelum request
        const startTime = Date.now();

        // Melakukan request ke Google
        await axios.get(domain);

        // Menghitung waktu respons
        const endTime = Date.now();
        const kecepatanResponS = (endTime - startTime) / 1000;

        await sock.sendMessage(
            remoteJid,
            {
                text: `⌬ _Response Time :_ ${kecepatanResponS.toFixed(6)} s\n⌬ _Ping :_ ${domain}`
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in ping handler:", error);

        // Mengirim pesan error jika terjadi kesalahan
        await sock.sendMessage(
            remoteJid,
            { text: "Maaf, terjadi kesalahan saat melakukan ping. Coba lagi nanti!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["ping"],
    OnlyPremium : false,
    OnlyOwner   : false
};
