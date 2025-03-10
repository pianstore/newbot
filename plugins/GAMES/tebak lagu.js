const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");
const api           = new ApiAutoresbot(config.APIKEY);
const mess          = require('@mess');
const { logWithTime }  = require('@lib/utils');

const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak lagu");

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.includes("lagu")) {
        return true;
    }

    try {
        const response = await api.get(`/api/game/tebaklagu`);

        const UrlData = response.data.link_song;
        const answer = response.data.jawaban;
        const artist = response.data.artist;
    
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
            hadiah  : 10 // jumlah money jika menang
        });
    
    
        await sock.sendMessage(remoteJid, { audio: { url: UrlData }, mimetype: 'audio/mp4' }, { quoted: message });
    
        await sock.sendMessage(
            remoteJid,
            { text: `Lagu Tersebut Adalah Lagu dari?\n\nArtist : ${artist}\nWaktu : 60 s` },
            { quoted: message }
        );
    
        logWithTime('Tebak lagu', `Jawaban : ${answer}`);
        
    
        // Set timer untuk 60 detik
        setTimeout(async () => {
            if (isUserPlaying(remoteJid)) {
                removeUser(remoteJid); // Hapus user dari database jika waktu habis
                await sock.sendMessage(
                    remoteJid,
                    {text: `⏳ Waktu habis! Jawabannya : ${answer}` },
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
    Commands: ["tebak", "tebaklagu"],
    OnlyPremium: false,
    OnlyOwner: false,
};
