const fs = require('fs');
const path = require('path');
const { determineUser } = require('@lib/utils');


async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    try {
         // Validasi input: Konten harus ada
        if (!content) {
            await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ _*${prefix + command} 6285246154386*_`
                },
                { quoted: message }
            );
            return;
        }

        const userToAction = determineUser(mentionedJid, isQuoted, content);
        if (!userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        // Ekstrak nomor telepon dari input
        let targetNumber = userToAction.replace(/\D/g, ''); // Hanya angka

        // Validasi panjang nomor telepon
        if (targetNumber.length < 10 || targetNumber.length > 15) {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Nomor tidak valid.` },
                { quoted: message }
            );
            return;
        }

        // Tambahkan domain jika belum ada
        if (!targetNumber.endsWith('@s.whatsapp.net')) {
            targetNumber += '@s.whatsapp.net';
        }


        // Loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Pastikan folder sesi ada
        const SESSION_PATH = './session/';

        const senderId = targetNumber.replace('@s.whatsapp.net', '');
        const sessionPath = path.join(SESSION_PATH, senderId);
        const sessionExists = fs.existsSync(sessionPath);

        if (sessionExists) {
            // Hapus folder sesi
            await sock.sendMessage(
                remoteJid,
                { text: `✅ _${senderId} berhasil di stop_` },
                { quoted: message }
            );
            const { updateJadibot } = require('@lib/jadibot');
            await updateJadibot(senderId, 'stop');
        } else {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Folder sesi untuk ${senderId} tidak ditemukan._` },
                { quoted: message }
            );
        }

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ Terjadi kesalahan saat memproses perintah.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['stopjadibot'],
    OnlyPremium : false,
    OnlyOwner   : true
};
