const { addBadword, findBadword } = require("@lib/badword");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {
        // Pastikan data grup tersedia
        const dataGrub = await ensureGroupData(remoteJid);

        const badwordList = dataGrub.listBadword.map(item => `◧ ${item}`).join("\n") || "";
        const total = dataGrub.listBadword.length;

        let responseMessage = '⚠️ _Tidak ada list badword_';
        if(dataGrub.listBadword.length > 0) {
            responseMessage = `*▧ 「 LIST BADWORDS 」*\n\n${badwordList}\n\n*Total: ${total}*`;
        }

        // Kirim respons ke grup
        return await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
        return await sendResponse(sock, remoteJid, "Terjadi kesalahan saat memproses perintah.", message);
    }
}

async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands    : ["badword", 'listbadword'],
    OnlyPremium : false,
    OnlyOwner   : false
};
