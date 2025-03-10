const moment = require('moment-timezone');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    // Mendapatkan waktu saat ini di zona waktu Asia/Jakarta
    const currentTime = moment().tz("Asia/Jakarta").format("HH:mm");

    // Mengirim pesan waktu saat ini
    return await sock.sendMessage(
        remoteJid,
        { text: `Sekarang jam ${currentTime}` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ["now"],
    OnlyPremium: false,
    OnlyOwner: false
};
