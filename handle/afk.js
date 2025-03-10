const { findUser, updateUser } = require("@lib/users");
const { formatDuration } = require("@lib/utils"); // Fungsi untuk menghitung durasi waktu
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');
const { logCustom } = require("@lib/logger");

async function process(sock, messageInfo) {
    const { remoteJid, message, sender, pushName, mentionedJid } = messageInfo;

    try {
        // Fungsi untuk membangun pesan AFK
        const buildAfkMessage = (name, afkData) => {
            const durasiAfk = formatDuration(afkData.lastChat);
            const alasanTeks = afkData.alasan ? `\n\n📌 ${afkData.alasan}` : "\n\n📌 Tanpa Alasan";
            return `🚫 *Jangan tag dia!*\n\n❏ _${name} sedang AFK sejak *${durasiAfk}*_${alasanTeks}\n`;
        };

        // Cek status AFK pengguna saat ini
        let userAfk;
        const cachedData = getCache(`afk-${sender}`);
        if (cachedData) {
            userAfk = cachedData.data; // Menggunakan data dari cache
        } else {
            userAfk = await findUser(sender); // Mengambil data baru
            setCache(`afk-${sender}`, userAfk);
        }

        let userGlobal;
        const cachedDataGlobal = getCache(`afk-global`);
        if (cachedDataGlobal) {
            userGlobal = cachedDataGlobal.data; // Menggunakan data dari cache
        } else {
            userGlobal = await findUser(); // Mengambil data baru
            setCache(`afk-global`, userGlobal);
        }


        if (userAfk?.status === "afk" && userAfk.afk) {
            const afkMessage = `🕊️ ${pushName} telah kembali dari AFK sejak _*${formatDuration(userAfk.afk.lastChat)}*_.${userAfk.afk.alasan ? `\n\n📌 ${userAfk.afk.alasan}` : "\n\n📌 Tanpa Alasan"}`;
            await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message });
            await updateUser(sender, { status: "aktif", afk: null });
            deleteCache(`afk-${sender}`);  // reset cache
            deleteCache(`afk-global`);  // reset cache
            return false;
        }

       // Cek jika pengguna AFK di-mention
        // if (mentionedJid?.length > 0) {
        //     const mentionedUsers = await Promise.all(mentionedJid.map(userGlobal)); // Ambil data semua pengguna yang di-mention
        //     for (const mentionedUser of mentionedUsers) {
        //         if (mentionedUser?.status === "afk" && mentionedUser.afk) {
        //             const afkMessage = buildAfkMessage(mentionedUser.name || "Pengguna", mentionedUser.afk);
        //             await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message });
        //             break; // Keluar dari loop setelah mengirim pesan pertama
        //         }
        //     }
        // }


            if (mentionedJid?.length > 0) {
                const mentionedUsers = await Promise.all(
                    mentionedJid.map(async (jid) => {
                        return await findUser(jid); // Ambil data pengguna berdasarkan JID
                    })
                );
            for (const mentionedUser of mentionedUsers) {
                    if (mentionedUser?.status === "afk" && mentionedUser.afk) {
                        const afkMessage = buildAfkMessage(mentionedUser.name || "Pengguna", mentionedUser.afk);
                        await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message });
                        break; // Keluar dari loop setelah mengirim pesan pertama
                    }
                }
            }


            
    } catch (error) {
        console.error("Error in AFK process:", error);
        logCustom('info', error, `ERROR-AFK-HANDLE.txt`);
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name        : "Afk",
    priority    : 3,
    process,
};
