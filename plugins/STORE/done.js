const { sendMessageWithMention, getCurrentTime, getCurrentDate, reply } = require('@lib/utils');
const { getGroupMetadata } = require('@lib/cache');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { m, remoteJid, sender, message, isQuoted } = messageInfo;

    try {

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }


        // Validasi pesan yang dibalas
        if (!isQuoted) {
            return await reply(m, '⚠️ _Balas sebuah pesanan berupa teks._');
        }

        // Mendapatkan tanggal dan waktu saat ini
        const date = getCurrentDate();
        const time = getCurrentTime();

        // Mendapatkan metadata grup
        const groupName = groupMetadata.subject || 'Grup';
        
        // Menyiapkan catatan dari pesan yang dikutip
        const note = isQuoted.content?.caption 
                ? isQuoted.content.caption 
                : isQuoted.text;
    
        const quotedSender = `@${isQuoted.sender.split('@')[0]}`;

        // Template pesan transaksi berhasil
        const templateMessage = `_*TRANSAKSI BERHASIL「 ✅ 」*_

⏰ Jam      : ${time}
📅 Tanggal  : ${date}
📂 Grup     : ${groupName}
📝 Catatan  : ${note}

${quotedSender} _Terima kasih sudah order!_`;

        // Mengirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid, templateMessage, message);
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

module.exports = {
    handle,
    Commands    : ['done', 'd', 'selesai'],
    OnlyPremium : false,
    OnlyOwner   : false,
};