const { ReminiV1 } = require('@scrape/remini');
const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content, prefix, command, type, isQuoted } = messageInfo;

    try {

        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'viewonce' || !isQuoted) {
            return await reply(m, `⚠️ _Balas gambar sekali lihat dengan caption *${prefix + command}*_`);
        }
    
        // Tampilkan reaksi "Loading"
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Download
        const media     = await downloadQuotedMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        // Membaca file menjadi Buffer
        const mediaBuffer = fs.readFileSync(mediaPath);

        await sock.sendMessage(
            remoteJid,
            {
                image: mediaBuffer,
                caption: mess.general.success,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error('Kesalahan saat memproses perintah Hd:', error);

        // Kirim pesan kesalahan yang lebih informatif
        const errorMessage = `_Terjadi kesalahan saat memproses gambar._`;
        await reply(m, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['rvo'],
    OnlyPremium : false,
    OnlyOwner   : false
};