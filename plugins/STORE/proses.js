const { sendMessageWithMention, getCurrentTime, getCurrentDate, reply } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { m, remoteJid, sender, message, isQuoted } = messageInfo;

    try {
        

        const date = getCurrentDate();
        const time = getCurrentTime();

        // Mendapatkan metadata grup
        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if(!isQuoted) return await reply(m ,'⚠️ _Balas sebuah pesanan berupa teks._')

        const groupName = groupMetadata.subject || '';

        const quotedSender = `@${isQuoted.sender.split('@')[0]}`;

        // Template pesan
        const note = isQuoted.content?.caption 
                ? isQuoted.content.caption 
                : isQuoted.text;
                const templateMessage = `_*TRANSAKSI PENDING「 ✅ 」*_

⏰ Jam      : ${time}
📅 Tanggal  : ${date}
📂 Grup     : ${groupName}
📝 Catatan  : ${note}
                
${quotedSender} _Transaksi sedang di proses!_`;
        // Kirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid, templateMessage, message);
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handle,
    Commands    : ['proses','process','proces'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
