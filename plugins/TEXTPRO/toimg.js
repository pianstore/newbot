const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const mess = require('@mess');
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;

        if (mediaType === "sticker") {
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
            const buffer = await api.getBuffer("/api/convert/giftoimage", { url });

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
                { text:`⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_` },
                { quoted: message }
            );
        }
    } catch (error) {
        console.log(error)
        await sock.sendMessage(
            remoteJid,
            { text: "Maaf, terjadi kesalahan. Coba lagi nanti!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands        : ["toimg"],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};
