const mess = require('@mess');
const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/tictactoe");
const TicTacToe = require("@games/tictactoe");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup, command } = messageInfo;

    const GAME_DURATION = 120000; // 120 detik
    const groupOnlyMessage = { text: mess.game.isGroup };
    const waitingMessage = `Menunggu partner (120 s)... \n\nKetik *${command}* untuk menanggapi`;
    const timeoutMessage = `⏳ Waktu habis! Tidak ada lawan yang ingin bermain`;

    // Cek apakah permainan di grup
    if (!isGroup) {
        return sock.sendMessage(remoteJid, groupOnlyMessage, { quoted: message });
    }

    // Cek apakah user sedang bermain
    const isPlaying = isUserPlaying(remoteJid);
    if (isPlaying) {
        const currentGame = getUser(remoteJid);
        if (currentGame.state === 'PLAYING') return true
            awaitsock.sendMessage(
                remoteJid,
                { text: mess.game.isPlaying },
                { quoted: message }
            );
            return true
    }


    // Tambahkan pengguna ke database
    addUser(remoteJid, {
        id_room: remoteJid,
        playerX: sender,
        playerO: null,
        state: 'WAITING',
        game: new TicTacToe(sender, 'o'),
    });

    // Set timer untuk 120 detik
    setTimeout(async () => {
        if (isUserPlaying(remoteJid)) {
            const currentGame = getUser(remoteJid);
            if (currentGame.state === 'PLAYING') return true
            
            removeUser(remoteJid); // Hapus user jika waktu habis
            await sock.sendMessage(
                remoteJid,
                { text: timeoutMessage },
                { quoted: message }
            );
            return true
        }
    }, GAME_DURATION);

    // Kirim pesan menunggu
    await sock.sendMessage(
        remoteJid,
        { text: waitingMessage },
        { quoted: message }
    );
    return true
}

module.exports = {
    handle,
    Commands: ["ttc", "ttt", "tictactoe"],
    OnlyPremium: false,
    OnlyOwner: false,
};
