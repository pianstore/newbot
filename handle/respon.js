const { getDataByGroupId }  = require('@lib/list');
const fs                    = require('fs').promises;

async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message, content , fullText } = messageInfo;

    try {
        const keyword = fullText.trim(); // Menghapus spasi di awal/akhir
        if(!keyword) return
        let currentList = await getDataByGroupId('owner')
        if (!currentList) return;

        const searchResult = Object.keys(currentList.list).filter(item => 
            item.toLowerCase().includes(keyword.toLowerCase())
        );

        if (searchResult.length === 0) return;
        const { text, media } = currentList.list[searchResult[0]].content;

        if (media) {
            const buffer = await getMediaBuffer(media);
            if (buffer) {
                await sendMediaMessage(sock, remoteJid, buffer, text, message);
            } else {
                console.error(`Media not found or failed to read: ${media}`);
            }
        } else {
            await sendTextMessage(sock, remoteJid, text, message);
        }
        return false;
    } catch (error) {
        console.error("Error processing message:", error);
    }
}

async function getMediaBuffer(mediaFileName) {
    const filePath = `./database/media/${mediaFileName}`;
    try {
        return await fs.readFile(filePath);
    } catch (error) {
        console.error(`Failed to read media file: ${filePath}`, error);
        return null;
    }
}

async function sendMediaMessage(sock, remoteJid, buffer, caption, quoted) {
    try {
        await sock.sendMessage(remoteJid, { image: buffer, caption }, { quoted });
    } catch (error) {
        console.error("Failed to send media message:", error);
    }
}

async function sendTextMessage(sock, remoteJid, text, quoted) {
    try {
        await sock.sendMessage(remoteJid, { text }, { quoted });
    } catch (error) {
        console.error("Failed to send text message:", error);
    }
}

module.exports = {
    name        : "List Response",
    priority    : 9,
    process,
};
