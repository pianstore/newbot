const config = require("@config");
const { createUser, saveUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validasi input konten
        if (!content || !content.includes(" ")) {
            await sock.sendMessage(remoteJid, {
                text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} xxx@gmail.com pass123*_`
            }, { quoted: message });
            return;
        }

        // Pisahkan string menjadi email dan password
        const [email, password] = content.split(" ");

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await sock.sendMessage(remoteJid, {
                text: "_Format email tidak valid. Contoh: xxx@gmail.com_"
            }, { quoted: message });
            return;
        }

        // Ekstrak username dari email
        const username = email.split('@')[0];

        // Kirim reaksi untuk memberi tahu bahwa proses sedang berjalan
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Panggil fungsi createUser untuk membuat pengguna
        const result = await createUser(email, username, password, true);

        if (result) {
            // Jika pengguna berhasil dibuat, simpan data pengguna
            await saveUser();  // Pastikan saveUser menyimpan data terbaru dengan benar
        }

        // Kirim pesan sukses setelah pengguna dibuat
        await sock.sendMessage(remoteJid, {
            text: `✅ _Pengguna Admin Panel berhasil dibuat_\n\n- Email: ${email}\n- Username: ${username}\n- Password: ${password}`
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Ambil pesan error dari properti `errors` jika ada
        let errorMessage = "❌ Terjadi kesalahan saat membuat pengguna.\n";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage += "\n";
            error.errors.forEach(err => {
                errorMessage += `- ${err.detail}\n`;
            });
        }

        // Kirim pesan error ke pengguna
        try {
            if (remoteJid) {
                await sock.sendMessage(remoteJid, {
                    text: errorMessage.trim()
                }, { quoted: messageInfo?.message });
            } else {
                console.error("RemoteJid tidak tersedia untuk mengirim pesan error");
            }
        } catch (sendError) {
            console.error("Error sending error message:", sendError);
        }
    }
}

module.exports = {
    handle,
    Commands    : ['createadminpanel'],
    OnlyPremium : false,
    OnlyOwner   : true,
};
