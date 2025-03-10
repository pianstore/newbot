const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const mess = require('@mess');
const fs = require("fs");
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

    try {

        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType === "image") {

             // Tampilkan reaksi "Loading"
            await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

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

            const buffer = await api.getBuffer("/api/tools/removebg", { url });

            await sock.sendMessage(
                remoteJid,
                {
                    image: buffer,
                    caption: mess.general.success,
                },
                { quoted: message }
            );
        } else {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_` },
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
    Commands    : ["rmbg","removebg","nobg"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
