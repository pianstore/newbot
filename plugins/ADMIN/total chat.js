const mess = require("@mess");
const { getTotalChatPerGroup } = require("@lib/totalchat");
const { sendMessageWithMention } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Ambil total chat untuk grup
        const totalChatData = await getTotalChatPerGroup(remoteJid);

        if (Object.keys(totalChatData).length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: "_Belum ada data chat untuk grup ini._" },
                { quoted: message }
            );
        }

        // Hitung total chat di grup
        const totalChatCount = Object.values(totalChatData).reduce((sum, count) => sum + count, 0);

        // Sortir anggota berdasarkan jumlah chat
        const sortedMembers = Object.entries(totalChatData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Ambil 5 anggota teratas jika diperlukan

        // Format pesan untuk dikirim
        let response = `══✪〘 *👥 Total Chat* 〙✪══:\n\n`;
        sortedMembers.forEach(([memberId, count], index) => {
            response += `◧  @${memberId.split('@')[0]}: ${count} chat\n`;
        });

        response += `\n\n_Total chat di grup ini:_ ${totalChatCount}`

        // Kirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid, response, message);

    } catch (error) {
        console.error("Error handling total chat command:", error);
        return await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses permintaan Anda." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["totalchat"],
    OnlyPremium : false,
    OnlyOwner   : false
};
