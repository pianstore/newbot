const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak kata");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

async function process(sock, messageInfo) {
    const { remoteJid, content ,fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

       // Ketika menyerah
       if(fullText.toLowerCase().includes('nyerah')){
            removeUser(remoteJid);
            await sock.sendMessage(remoteJid, {
                text: `Yahh Menyerah\nJawaban: ${data.answer}\n\nIngin bermain? Ketik *.tebak kata*`,
            }, { quoted: message });
            return false;
        }

        if (fullText.toLowerCase() === data.answer) {
            const hadiah = data.hadiah;

            // Mencari pengguna
            const user = await findUser(sender);

            if (user) {
                const moneyAdd = (user.money || 0) + hadiah; // Default money ke 0 jika undefined
                await updateUser(sender, { money: moneyAdd });
            } else {
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            removeUser(remoteJid);
            await sock.sendMessage(remoteJid, {
                text: `🎉 Selamat! Tebakan Anda benar. Anda mendapatkan ${hadiah} Money.`,
            }, { quoted: message });
            return false;
        }
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name: "Tebak Kata",
    priority : 10,
    process,
};
