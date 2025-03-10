const { listSewa } = require("@lib/sewa");
const { selisihHari, hariini } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message } = messageInfo;

    try {
        // Ambil data list berdasarkan grup
        const sewa = await listSewa();

        // Jika tidak ada list
        if (!sewa || Object.keys(sewa).length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '⚠️ _Tidak Ada daftar sewa ditemukan_'
            });
            return;
        }

        // Konversi objek ke array dan urutkan berdasarkan waktu expired terbaru
        const sortedSewa = Object.entries(sewa).sort(([, a], [, b]) => a.expired - b.expired);


        // Buat daftar untuk ditampilkan
        let listMessage = '*▧ 「 LIST SEWA* 」\n\n';
        sortedSewa.forEach(([groupId, data], index) => {
            listMessage += `╭─
│ ID Grup : ${groupId}
│ Expired : ${selisihHari(data.expired)}
╰────────────────────────\n`;
        });

        listMessage += `\n*Total : ${Object.keys(sewa).length}*`

        // Kirim pesan daftar sewa
        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_Terjadi kesalahan saat mengambil daftar sewa_'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['listsewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};
