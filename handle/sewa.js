const { findSewa, deleteSewa }  = require("@lib/sewa");
const config                    = require("@config");
const { selisihHari, danger }   = require("@lib/utils");
const { logCustom }     = require("@lib/logger");

const notificationDays  = 3; // Jumlah hari sebelum notifikasi dikirim
const notifiedGroups    = new Set(); // Cache untuk grup yang sudah menerima notifikasi
const nonSewaGroups     = new Set();

async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;

    if (!isGroup) {
        return true;
    }

    const dataSewa =  await findSewa(remoteJid);

    if (dataSewa) {
        const now = Date.now(); // Timestamp sekarang dalam milidetik
        const notificationMs    = notificationDays * 24 * 60 * 60 * 1000; // Notifikasi dalam milidetik
        const timeRemaining     = dataSewa.expired - now; // Sisa waktu dalam milidetik

        const selisihHariSewa = selisihHari(dataSewa.expired);

        if (timeRemaining <= notificationMs && timeRemaining > 0) {

            if (!notifiedGroups.has(remoteJid)) {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text: `⚠️ _*Peringatan!*_\n\n_Masa Sewabot :_ ${selisihHariSewa}`,
                    },
                    { quoted: message }
                );

                notifiedGroups.add(remoteJid); // Tandai grup sebagai sudah menerima notifikasi
                return false;
            }
        } else if (timeRemaining <= 0) {
            // Jika masa berlaku sudah habis
            await sock.sendMessage(
                remoteJid,
                {
                    text: `❌ _*Masa SewaBOT Telah Habis*_\n_Bot akan keluar otomatis_\n\nTerima kasih sudah menggunakan layanan sewa autoresbot.\n\n*Nomor Owner*\nwa.me/${config.owner_number[0]}`,
                },
                { quoted: message }
            );

            // Delete database sewa
            await deleteSewa(remoteJid);

            try {
                await sock.groupLeave(remoteJid);
                danger('Sewa Habis', `Berhasil keluar Grub :  ${remoteJid}`);
            } catch (error) {
                console.error(`Gagal keluar dari grup ${remoteJid}:`, error);
                danger('Sewa Habis', `Gagal keluar grup : ${remoteJid}:`);
                logCustom('info', 'Gagal keluar grup', `gagal-keluar-grub-sewa-${remoteJid}.txt`);
            }
            return false;
        }
    }else {
         // Hanya log grup non-sewa satu kali
        if (!nonSewaGroups.has(remoteJid)) {
            danger('Detect Bukan Sewa', `Tidak termasuk sewabot :  ${remoteJid}`);
            logCustom('info', 'GRUB INI BUKAN TERMASUK SEWABOT', `bukan-sewa-${remoteJid}.txt`);
            nonSewaGroups.add(remoteJid); // Tandai grup sebagai bukan sewa
        }
    }
}

module.exports = {
    name        : "Sewa Handle",
    priority    : 10,
    process,
};
