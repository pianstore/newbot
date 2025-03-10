const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");
const api           = new ApiAutoresbot(config.APIKEY);
const mess          = require('@mess');
const { logWithTime }  = require('@lib/utils');

const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak kalimat");

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.includes("kalimat")) {
        return true;
    }

    try {
        const response = await api.get(`/api/game/tebakkalimat`);

        const soal      = response.data.soal;
        const jawaban   = response.data.jawaban;
    
        // Ketika sedang bermain
        if (isUserPlaying(remoteJid)) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.game.isPlaying },
                { quoted: message }
            );
        }
    
        // Tambahkan pengguna ke database
        addUser(remoteJid, {
            answer: jawaban.toLowerCase(),
            hadiah  : 10 // jumlah money jika menang
        });
    
    
        await sock.sendMessage(
            remoteJid,
            { text: `Silahkan Jawab Pertanyaan Berikut\n\n${soal}\nWaktu : 60s` },
            { quoted: message }
        );

        logWithTime('Tebak Kalimat', `Jawaban : ${jawaban}`);
    
        // Set timer untuk 60 detik
        setTimeout(async () => {
            if (isUserPlaying(remoteJid)) {
                removeUser(remoteJid); // Hapus user dari database jika waktu habis
                await sock.sendMessage(
                    remoteJid,
                    {text: `⏳ Waktu habis! Jawabannya : ${jawaban}`},
                    { quoted: message }
                );
            }
        }, 60000); // 60 detik = 60000 ms


    } catch(error){
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n${error || "Kesalahan tidak diketahui"}`;
        await sock.sendMessage(
            remoteJid,
            { text: errorMessage },
            { quoted: message }
        );
        

    }


}

module.exports = {
    handle,
    Commands: ["tebak", "tebakkalimat"],
    OnlyPremium: false,
    OnlyOwner: false,
};
