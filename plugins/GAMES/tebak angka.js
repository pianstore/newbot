const mess = require('@mess');
const { logWithTime }  = require('@lib/utils');
const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak angka");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, fullText } = messageInfo;

    let level_tebakangka = "";
    
    if (!fullText.includes("angka")) {
        return true; // Skip plugin ini
    }

    const validLevels = ["easy", "normal", "hard", "expert", "setan"];
    const args = content.split(" ");
    const KATA_TERAKHIR = args[args.length - 1];

    if (validLevels.includes(KATA_TERAKHIR)) {
        level_tebakangka = KATA_TERAKHIR;
    } else {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `Masukkan Level\n\nContoh *tebak angka easy*\n\n*Opsi*\neasy\nnormal\nhard\nexpert\nsetan`,
            },
            { quoted: message }
        );
    }

    const levelMap = {
        easy: 10,
        normal: 100,
        hard: 1000,
        expert: 10000,
        setan: 10000000000,
    };

    const akhir_angkaAcak = levelMap[level_tebakangka];
    const angkaAcak = Math.floor(Math.random() * akhir_angkaAcak) + 1;
    if (isUserPlaying(remoteJid)) {
        return await sock.sendMessage(
            remoteJid,
            { text: mess.game.isPlaying },
            { quoted: message }
        );
    }

    // Tambahkan pengguna ke database
    addUser(remoteJid, {
        angkaAcak,
        level: level_tebakangka,
        angkaEnd: akhir_angkaAcak,
        attempts: 6, // jumlah percobaan
        hadiah  : 10 // jumlah money jika menang
    });

    // Kirim pesan awal
    await sock.sendMessage(
        remoteJid,
        {
            text: `Game dimulai! Tebak angka dari 1 hingga ${akhir_angkaAcak} untuk level *${level_tebakangka}*. Anda memiliki waktu 60 detik!`,
        },
        { quoted: message }
    );


    logWithTime('Tebak Angka', `Jawaban : ${angkaAcak}`);

    // Set timer untuk 60 detik
    setTimeout(async () => {
        if (isUserPlaying(remoteJid)) {
            removeUser(remoteJid); // Hapus user dari database jika waktu habis
            await sock.sendMessage(
                remoteJid,
                { text: `⏳ Waktu habis! Jawabannya : ${angkaAcak}`},
                { quoted: message }
            );
        }
    }, 60000); // 60 detik = 60000 ms
}

module.exports = {
    handle,
    Commands: ["tebak", "tebakangka"],
    OnlyPremium: false,
    OnlyOwner: false,
};
