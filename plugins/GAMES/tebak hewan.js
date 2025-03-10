const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");
const api           = new ApiAutoresbot(config.APIKEY);
const mess          = require('@mess');
const { logWithTime }  = require('@lib/utils');

const { addUser, removeUser, isUserPlaying } = require("@tmpDB/tebak hewan");

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.includes("hewan")) {
        return true;
    }

    try {
        
    const response = await api.get(`/api/game/hewan`);

    const question_image    = response.data.question_image;
    const answer_image      = response.data.answer_image;
    const answer            = response.data.answer;

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
        answer: answer.toLowerCase(),
        answer_image,
        hadiah  : 10 // jumlah money jika menang
    });

    await sock.sendMessage(remoteJid, { image: { url: question_image }, caption: `Sebutkan Nama Hewan Di Atas\n\nWaktu : 60s` }, { quoted: message });

    logWithTime('Tebak Hewan', `Jawaban : ${answer}`);

    // Set timer untuk 60 detik
    setTimeout(async () => {
        if (isUserPlaying(remoteJid)) {
            removeUser(remoteJid); // Hapus user dari database jika waktu habis
        
            await sock.sendMessage(remoteJid, { image: { url: answer_image }, caption: `⏳ Waktu habis! Jawabannya : ${answer}` }, { quoted: message });
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
    Commands: ["tebak", "tebakhewan"],
    OnlyPremium: false,
    OnlyOwner: false,
};
