const { groupFetchAllParticipating } = require("@lib/cache");
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const jeda = 5000; // 5 detik

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command, isQuoted, type } = messageInfo;

    const useMentions = false; // Ubah menjadi true jika ingin menggunakan mention

    try {
        // Validasi input kosong atau tidak sesuai format
        if (!content || content.trim() === '') {
            return sendErrorMessage(sock, remoteJid, message, prefix, command);
        }

        // Tampilkan reaksi sementara untuk memproses
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Ambil metadata grup
        const groupFetchAll = await groupFetchAllParticipating(sock);
        if (!groupFetchAll) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Tidak ada grup ditemukan.` },
                { quoted: message }
            );
        }


        // Filter grup berdasarkan kondisi tertentu
        const groupIds = Object.values(groupFetchAll)
            .filter(group => group.isCommunity == false) // Sesuaikan kondisi
            .map(group => group.id);

        if (groupIds.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Tidak ada grup dengan kondisi yang sesuai ditemukan.` },
                { quoted: message }
            );
        }

        // Ambil informasi pesan
        const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
        const pesangc = content; // Isi pesan untuk dikirim


        let buffer;
        if (mediaType === 'imageMessage') {
            const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
    
            const mediaPath = path.join("tmp", media);
    
            if (!fs.existsSync(mediaPath)) {
                throw new Error("File media tidak ditemukan setelah diunduh.");
            }
    
            buffer = fs.readFileSync(mediaPath);
        }
        
        
       // Kirim pesan ke semua grup
        for (const groupId of groupIds) {
            const participants = Object.values(groupFetchAll[groupId]?.participants || []);
            const mentions = useMentions ? participants.map(p => p.id) : undefined;

            if (mediaType === 'imageMessage') {
                await sock.sendMessage(
                    groupId,
                    {
                        image: buffer,
                        caption: pesangc,
                        mentions: mentions,
                    }
                );
            } else {
                await sock.sendMessage(
                    groupId,
                    {
                        text: pesangc,
                        mentions: mentions,
                    }
                );
            }

            // Jeda 5 detik
            await sleep(jeda);
        }

        // Kirim konfirmasi sukses
        await sock.sendMessage(
            remoteJid,
            { text: `✅ Pesan berhasil dikirim ke ${groupIds.length} grup` },
            { quoted: message }
        );
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ Terjadi kesalahan saat memproses perintah.` },
            { quoted: message }
        );
    }
}

function sendErrorMessage(sock, remoteJid, message, prefix, command) {
    return sock.sendMessage(
        remoteJid,
        {
            text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} pengumuman bot whatsapp*_`
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['jpm'],
    OnlyPremium : false,
    OnlyOwner   : true,
};
