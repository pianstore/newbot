const { createBackup } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const backupFilePath = await createBackup();

        await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Berhasil, data backup telah disimpan_\n\n_Lokasi :_ ${backupFilePath}`
            },
            { quoted: message }
        );
    } catch (err) {
        console.error('Backup failed:', err);

        await sock.sendMessage(
            remoteJid,
            {
                text: `❌ _Gagal melakukan backup:_ ${err.message}`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['backup'],
    OnlyPremium : false,
    OnlyOwner   : true
};
