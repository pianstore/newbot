const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

    try {
        if (!content) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot*_`},
                { quoted: message }
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const mediaType = isQuoted ? isQuoted.type : type;

        if (mediaType === "image") {
            const [smemeText1 = '', smemeText2 = ''] = (content || '').split('|');

            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);
            if (!fs.existsSync(mediaPath)) {
                throw new Error("File media tidak ditemukan setelah diunduh.");
            }


            const api = new ApiAutoresbot(config.APIKEY);
            const response = await api.tmpUpload(mediaPath);

            if (!response || response.code !== 200) {
                throw new Error("File upload gagal atau tidak ada URL.");
            }
            const url = response.data.url;

            const buffer = await api.getBuffer("/api/maker/smeme", {
                text: smemeText1,
                text2: smemeText2,
                pp: url,
                width: 500,
                height: 500,
            });

            const webpBuffer = await sharp(buffer).webp().toBuffer();

            const options = {
                packname: config.sticker_packname,
                author: config.sticker_author,
            };

            await sendImageAsSticker(sock, remoteJid, webpBuffer, options, message);
        } else {
            return await sock.sendMessage(
                remoteJid,
                { text:`⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_` },
                { quoted: message }
            );
        }
    } catch (error) {
        await sock.sendMessage(
            remoteJid,
            { text: "Maaf, terjadi kesalahan. Coba lagi nanti!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands        : ["smeme"],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};
