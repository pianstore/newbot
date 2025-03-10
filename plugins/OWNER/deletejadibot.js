const fs = require('fs');
const path = require('path');
const { determineUser } = require('@lib/utils');

// Fungsi untuk menghapus folder secara rekursif
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const currentPath = path.join(folderPath, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                // Jika item adalah folder, hapus secara rekursif
                deleteFolderRecursive(currentPath);
            } else {
                // Jika item adalah file, hapus file
                fs.unlinkSync(currentPath);
            }
        });
        // Hapus folder setelah isinya kosong
        fs.rmdirSync(folderPath);
    }
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender,mentionedJid, isQuoted, prefix, command } = messageInfo;

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
            deleteFolderRecursive(sessionPath);
            await sock.sendMessage(
                remoteJid,
                { text: `✅ _Folder sesi untuk ${senderId} berhasil dihapus._` },
                { quoted: message }
            );
            const { deleteJadibot }            = require('@lib/jadibot');
            await deleteJadibot(senderId);
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
    Commands    : ['deletejadibot','deljadibot'],
    OnlyPremium : false,
    OnlyOwner   : true
};
