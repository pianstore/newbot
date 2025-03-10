const ApiAutoresbot    = require("api-autoresbot");
const { logWithTime }  = require('@lib/utils');
const config           = require("@config");
const mess             = require("@mess");

const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/cak lontong");

const api = new ApiAutoresbot(config.APIKEY);

/**
 * Mengirim pesan ke pengguna.
 * @param {Object} sock - Instance koneksi.
 * @param {string} remoteJid - ID pengguna.
 * @param {Object} content - Konten pesan.
 * @param {Object} options - Opsi tambahan untuk pengiriman pesan.
 */
const sendMessage = async (sock, remoteJid, content, options = {}) => {
    try {
        await sock.sendMessage(remoteJid, content, options);
    } catch (error) {
        console.error(`Gagal mengirim pesan ke ${remoteJid}:`, error);
    }
};

/**
 * Menangani game Cak Lontong.
 * @param {Object} sock - Instance koneksi.
 * @param {Object} messageInfo - Informasi pesan.
 */
const handle = async (sock, messageInfo) => {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.includes("lontong")) {
        return true;
    }

    // Cek apakah pengguna sudah bermain
    if (isUserPlaying(remoteJid)) {
        await sendMessage(sock, remoteJid, { text: mess.game.isPlaying }, { quoted: message });
        return;
    }

    try {
        const response = await api.get("/api/game/caklontong");
        const { soal, jawaban, deskripsi } = response.data;

        // Tambahkan pengguna ke database
        addUser(remoteJid, {
            answer: jawaban.toLowerCase(),
            hadiah: 10, // Jumlah hadiah jika menang
            deskripsi,
        });

        // Kirim pertanyaan ke pengguna
        await sendMessage(
            sock,
            remoteJid,
            { text: `*Jawablah Pertanyaan Berikut :*\n${soal}\n*Waktu : 60s*` },
            { quoted: message }
        );

        logWithTime('Caklontong', `Jawaban : ${jawaban}`);

        // Timer 60 detik untuk menjawab
        setTimeout(async () => {
            if (isUserPlaying(remoteJid)) {
                removeUser(remoteJid);
                await sendMessage(
                    sock,
                    remoteJid,
                    {
                        text: `Waktu Habis\nJawaban: ${jawaban}\nDeskripsi: ${deskripsi}\n\nIngin bermain? Ketik .cak lontong`,
                    },
                    { quoted: message }
                );
            }
        }, 60000); // 60 detik = 60000 ms
    } catch (error) {

        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n${error || "Kesalahan tidak diketahui"}`;
        await sendMessage(sock, remoteJid, { text: errorMessage }, { quoted: message });
    }
};

module.exports = {
    handle,
    Commands    : ["cak", "caklontong"],
    OnlyPremium : false,
    OnlyOwner   : false,
};
