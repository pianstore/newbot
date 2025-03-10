const { findGroup, updateGroup, addGroup, deleteGroup } = require("@lib/group");

async function handle(sock, messageInfo) {
    const { remoteJid, message, command } = messageInfo;

    try {
        // Cari data grup berdasarkan ID
        const dataGroup = await findGroup('owner');

        // Variabel untuk respon dan pembaruan data
        let responseText = "";
        let updateData = null;

        // Respon berdasarkan perintah
        switch (command) {
            case "self":
                updateData = { fitur: { self: true } };
                responseText =
                    "_Bot berhasil di-self. Bot hanya dapat digunakan oleh owner. Untuk menjadikannya agar semua orang bisa menggunakan ketik_ *.public*.";
                break;

            case "public":
                if (dataGroup) {
                    await deleteGroup('owner');
                }else {
                    responseText = '_Bot Sebelumnya sudah public_'
                    return await sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });
                }
                updateData = { fitur: { public: false } };
                responseText = "_Bot berhasil diatur menjadi public._";
                break;

            default:
                responseText = "_Perintah tidak dikenali._";
        }

        // Perbarui data grup jika ada perubahan
        if (updateData) {
            if (dataGroup) {
                await updateGroup('owner', updateData);
            } else {
                await addGroup('owner', updateData);
            }
        }

        // Kirim pesan ke grup
        await sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });
    } catch (error) {
        // Tangani kesalahan
        console.error(error.message);
        await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses perintah. Silakan coba lagi." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["self", "public"],
    OnlyPremium : false,
    OnlyOwner   : true
};
