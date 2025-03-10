const { sendMessageWithMention } = require('@lib/utils');
const config  = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    // Membuat vCard
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:${config.owner_name}
FN:${config.owner_name}
TEL;waid=${config.owner_number[0]}:${config.owner_number[0]}
EMAIL;type=INTERNET:${config.owner_email}
URL:https://autoresbot.com
ADR:;;${config.region};;;
END:VCARD`;

    // Membuat objek kontak
    const contact = [
        {
            displayName: config.owner_name,
            vcard: vcard
        }
    ];

    // Mengirim pesan kontak
    const chatId = await sock.sendMessage(remoteJid, {
        contacts: {
            displayName: `Owner Contact`,
            contacts: contact
        }
    }, { quoted: message });

        // Kirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid,  `Hai Kak @${sender.split("@")[0]}, Itu adalah nomor owner dari bot ini`, chatId);
}

module.exports = {
    handle,
    Commands    : ['owner'],
    OnlyPremium : false,
    OnlyOwner   : false
};
