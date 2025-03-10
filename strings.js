/*
╔═════════════════════════════════╗
║     🛠️ Informasi Script
╠═════════════════════════════════╣
║ 📦 Version   : 4.0
║ 👨‍💻 Developer : Azhari Creative    
║ 🌐 Website   : autoresbot.com   
╚═════════════════════════════════╝

⚠️ Peringatan: SCRIPT INI TIDAK BOLEH DIPERJUALBELIKAN
📌 Pembelian resmi hanya dapat dilakukan di website resmi: https://autoresbot.com
*/

const mess = {
    game: {
        isPlaying   : "⚠️ _Permainan sedang berlangsung._ Ketik *nyerah* untuk mengakhiri permainan.",
        isGroup     : "⚠️ _Permainan hanya bisa dimainkan di grup_",
        isStop      : "⚠️ _Fitur game dimatikan di grub ini_",
    },
    general : {
        isOwner     : '⚠️ _Perintah ini Hanya Untuk Owner Bot._',
        isPremium   : '⚠️ _Perintah ini Hanya Untuk pengguna premium._',
        isAdmin     : '⚠️ _Perintah ini Hanya Untuk Admin_',
        isGroup     : "⚠️ _Perintah ini Hanya digunakan di grup_",
        limit       : "⚠️ _Limit kamu sudah habis_ \n\n_Ketik *.claim* untuk mendapatkan limit_ _Atau 💎 Berlangganan Member Premium agar limitmu tanpa batas_",
        success     : "✅ _Success Kak_",
        isBlocked   : "⚠️ _Kamu sedang di block dari penggunaan bot ini_", // kalau block seluruhnya
        isBaned     : "⚠️ _Kamu sedang di ban pada grub ini_", // kalau ban hanya grub itu saja
        fiturBlocked: "⚠️ _Fitur sedang di ban di grub ini_",
    },
    action : {
        grub_open   : '✅ Grup berhasil dibuka',
        grub_close  : '✅ Grup berhasil ditutup',
        user_kick   : '✅ _Berhasil mengeluarkan peserta dari grup._',
        mute        : '_Grup telah berhasil di-mute. Semua perintah akan dinonaktifkan kecuali untuk menghidupkan kembali dengan mengetik_ *.unmute*.',
        unmute      : '_Grup telah berhasil di-unmute. Semua perintah kembali aktif._',
        resetgc     : '_Link Grub sudah di reset_'

    }
};

// Variable
global.group = {};
global.group.variable = `
☍ @name
☍ @date
☍ @day
☍ @desc
☍ @group
☍ @greeting
☍ @size
☍ @time`;

module.exports = mess;