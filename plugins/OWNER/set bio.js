async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    
    try {
        // Validasi input nama
        if (!content || !content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot pintar*_` },
                { quoted: message }
            );
        }

        // Perbarui bio bot
        await sock.updateProfileStatus(content);

        // Kirim pesan sukses
        return await sock.sendMessage(
            remoteJid,
            { text: `_Sukses mengganti bio bot menjadi *${content}*_` },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error processing message:", error);

        // Kirim pesan error
        return await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses pesan." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["setbio"],
    OnlyPremium : false,
    OnlyOwner   : true
};
