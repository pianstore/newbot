const { getDataByGroupId } = require('@lib/list');
const { applyTemplate } = require('@DB/templates/list');
const { getGroupMetadata } = require("@lib/cache");
const { checkMessage }      = require("@lib/participants");
const fs = require('fs').promises;
const { sendMessageWithMention, getCurrentTime, getCurrentDate, getGreeting, getHari } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, content, prefix, command } = messageInfo;

    let defaultLIst = 1;
    const result = await checkMessage(remoteJid, 'templatelist');

    if(result) {
        defaultLIst = result;
    }
    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const nameGrub      = groupMetadata.subject || '';
    const size      = groupMetadata.size || '';
    const desc      = groupMetadata.desc || '';

    try {
        // Ambil data list berdasarkan grup
        const currentList = await getDataByGroupId(remoteJid);

        // Jika tidak ada list
        if (!currentList || !currentList.list) {
            await sock.sendMessage(remoteJid, {
                text: '_Tidak Ada List Di Grup Ini, silakan ketik *addlist* untuk membuat baru_\n\n_Hanya *admin* yang dapat menambah / menghapus list_'
            });
            return;
        }

        if (Object.keys(currentList.list).length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '_Tidak Ada List Di Grup Ini, silakan ketik *addlist* untuk membuat baru_\n\n_Hanya *admin* yang dapat menambah / menghapus list_'
            });
            return;
        }

        const keywordList = Object.keys(currentList.list).sort();

        const firstElement = (content > 0 && content <= keywordList.length)
        ? keywordList[content - 1]
        : false;

        if (!firstElement) {
             // Data dinamis yang kita masukkan
             const data = {
                name    : `@${sender.split('@')[0]}`,
                date    : getCurrentDate(),
                day     : getHari(),
                desc     : desc,
                group   : nameGrub,
                greeting: getGreeting(),
                size    : size,
                time    : getCurrentTime(),
                list    : keywordList
            };
            const finalMessage = applyTemplate(defaultLIst, data);
            return await sendMessageWithMention(sock, remoteJid, finalMessage, message);
        }

        const searchResult = Object.keys(currentList.list).filter(item => 
            item.toLowerCase().includes(firstElement.toLowerCase())
        );

        if (searchResult.length === 0) {
            
            return await sock.sendMessage(remoteJid, {
                text: '_Tidak Ada List ditemukan_'
            });
        } else {

            const { text, media } = currentList.list[searchResult[0]].content;

            if (media) {
                const buffer = await getMediaBuffer(media);
                if (buffer) {
                    await sendMediaMessage(sock, remoteJid, buffer, text, message);
                } else {
                    console.error(`Media not found or failed to read: ${media}`);
                }
            } else {
                // Kirim pesan dengan mention
                await sendMessageWithMention(sock, remoteJid, text, message);
            }


        }
    } catch (error) {
        console.error(error);
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

module.exports = {
    handle,
    Commands    : ['list'],
    OnlyPremium : false,
    OnlyOwner   : false
};
