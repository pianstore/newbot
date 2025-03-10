const { findUser, updateUser, addUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    try {
        // Ambil data pengguna
        let userData = await findUser(sender);

        // Jika pengguna tidak ditemukan, tambahkan pengguna baru
        if (!userData) {
            userData = {
                money: 0,
                role: "user",
                status: "active",
                premium: null,
            };

            // Tambahkan ke database
            await addUser(sender, userData);
        }

        // Tentukan status premium dengan kalimat yang lebih baik
        let premiumStatus;
        if (userData.premium) {
            const premiumEndDate = new Date(userData.premium);
            premiumStatus = `📋 _Masa Premium kamu hingga:_ ${premiumEndDate.toLocaleString()}`;
        } else {
            premiumStatus = "📋 _Saat ini kamu tidak memiliki masa premium_";
        }

        const responseText = `_Halo_ @${sender.split('@')[0]} \n\n${premiumStatus}`;

        await sock.sendMessage(
            remoteJid,
            { text: responseText, mentions: [sender] },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error handling user data:", error);

        // Kirim pesan kesalahan ke pengguna
        await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses data. Silakan coba lagi nanti." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["cekprem","cekpremium"],
    OnlyPremium : false,
    OnlyOwner   : false,
};
