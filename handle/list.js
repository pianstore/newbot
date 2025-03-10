const { getDataByGroupId } = require('@lib/list');
const fs = require('fs').promises;
const { getCurrentDate, sendMessageWithMention, sendImagesWithMention, getCurrentTime, getGreeting, getHari } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

async function process(sock, messageInfo) {
    const { remoteJid, sender, isGroup, message, fullText } = messageInfo;

    if (!isGroup || !fullText) return true;

    try {
        const keyword = fullText.trim();
        if(!keyword) return
        
        const currentList =  await getDataByGroupId(remoteJid)
        if (!currentList) return;

        const searchResult = Object.keys(currentList.list).filter(item => 
            item.toLowerCase().includes(keyword.toLowerCase())
        );

        if (searchResult.length === 0) return;

        const { text, media } = currentList.list[searchResult[0]].content;

        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        if (!groupMetadata) {
            console.error("Failed to fetch group metadata");
            return;
        }
        
        const { subject, desc, size } = groupMetadata;
        const date      = getCurrentDate();
        const time      = getCurrentTime();
        const greeting  = getGreeting();
        const day       = getHari();
        const targetMention = `@${sender.split("@")[0]}`;

    const replacements = {
        "@name": targetMention,
        "@date": date,
        "@day": day,
        "@desc": desc,
        "@group": subject,
        "@greeting": greeting,
        "@size": size,
        "@time": time,
    };

        let customizedMessage = text;
        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(key.replace(/@/, "@"), "gi");
            customizedMessage = customizedMessage.replace(regex, value);
        }

    
        if (media) {
            const buffer = await getMediaBuffer(media);
            if (buffer) {
                await sendImagesWithMention(sock, remoteJid, buffer, customizedMessage, message);
                // await sendMediaMessage(sock, remoteJid, buffer, text, message);
            } else {
                console.error(`Media not found or failed to read: ${media}`);
            }
        } else {
            await sendMessageWithMention(sock, remoteJid, customizedMessage, message);
           // await sendTextMessage(sock, remoteJid, text, message);
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
    name        : "List Handle",
    priority    : 10,
    process,
};
