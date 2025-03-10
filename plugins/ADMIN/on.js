const { findGroup, updateGroup } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const {  updateSocket }     = require('@lib/scheduled');
const mess                 = require('@mess');

const icon_on  = '🟢';
const icon_off = '🔴';

// Membantu untuk memformat status fitur
const formatFeatureStatus = (status) => status ? icon_on : icon_off;

// Daftar fitur yang ada dalam group
const featureList = [
    { name: 'antilink', label: 'ᴀɴᴛɪʟɪɴᴋ' },
    { name: 'antilinkv2', label: 'ᴀɴᴛɪʟɪɴᴋᴠ2' },
    { name: 'antilinkwa', label: 'ᴀɴᴛɪʟɪɴᴋᴡᴀ' },
    { name: 'antilinkwav2', label: 'ᴀɴᴛɪʟɪɴᴋᴡᴀᴠ2' },
    { name: 'antidelete', label: 'ᴀɴᴛɪᴅᴇʟᴇᴛᴇ' },
    { name: 'antiedit', label: 'ᴀɴᴛɪᴇᴅɪᴛ' },
    { name: 'antigame', label: 'ᴀɴᴛɪɢᴀᴍᴇ' },
    { name: 'antifoto', label: 'ᴀɴᴛɪғᴏᴛᴏ' },
    { name: 'antivideo', label: 'ᴀɴᴛɪᴠɪᴅᴇᴏ' },
    { name: 'antiaudio', label: 'ᴀɴᴛɪᴀᴜᴅɪᴏ' },
    { name: 'antidocument', label: 'ᴀɴᴛɪᴅᴏᴄᴜᴍᴇɴᴛ' },
    { name: 'antikontak', label: 'ᴀɴᴛɪᴋᴏɴᴛᴀᴋ' },
    { name: 'antisticker', label: 'ᴀɴᴛɪsᴛɪᴄᴋᴇʀ' },
    { name: 'antipolling', label: 'ᴀɴᴛɪᴘᴏʟʟɪɴɢ' },
    { name: 'antispamchat', label: 'ᴀɴᴛɪsᴘᴀᴍᴄʜᴀᴛ' },
    { name: 'antivirtex', label: 'ᴀɴᴛɪᴠɪʀᴛᴇx' },
    { name: 'autoai', label: 'ᴀᴜᴛᴏᴀɪ', desc : '_Untuk menggunakan fitur ini silakan balas chat bot atau sebut *ai* di setiap pesan_' },
    { name: 'autosimi', label: 'ᴀᴜᴛᴏsɪᴍɪ', desc : '_Untuk menggunakan fitur ini silakan balas chat bot atau sebut *simi* di setiap pesan_' },
    { name: 'autorusuh', label: 'ᴀᴜᴛᴏʀᴜsᴜʜ' },
    { name: 'badword', label: 'ʙᴀᴅᴡᴏʀᴅ' },
    { name: 'detectblacklist', label: 'ᴅᴇᴛᴇᴄᴛʙʟᴀᴄᴋʟɪꜱᴛ' },
    { name: 'demote', label: 'demote' },
    { name: 'left', label: 'ʟᴇғᴛ' },
    { name: 'promote', label: 'promote' },
    { name: 'welcome', label: 'ᴡᴇʟᴄᴏᴍᴇ' },
    { name: 'waktusholat', label: 'ᴡᴀᴋᴛᴜꜱʜᴏʟᴀᴛ' },
    { name: 'onlyadmin', label: 'ᴏɴʟʏᴀᴅᴍɪɴ' }
];

// Membuat template dengan memeriksa status setiap fitur
const createTemplate = (fitur) => {
    let template = `ɢᴜɴᴀᴋᴀɴ *.ᴏɴ ᴄᴏᴍᴍᴀɴᴅ*\n\n`;

    featureList.forEach(({ name, label }) => {
        template += `[${formatFeatureStatus(fitur[name])}] ${label}\n`;
    });

    template += `

ᴄᴏɴᴛᴏʜ : *.ᴏɴ antilink*

Kᴇᴛᴇʀᴀɴɢᴀɴ
${icon_on} = Fɪᴛᴜʀ ᴀᴋᴛɪꜰ
${icon_off} = Fɪᴛᴜʀ ᴛɪᴅᴀᴋ ᴀᴋᴛɪꜰ`;

    return template;
};

// Fungsi untuk mengaktifkan fitur secara dinamis
const activateFeature = async (remoteJid, featureName, currentStatus, desc) => {
    if (currentStatus) {
        return `⚠️ _Fitur *${featureName}* sudah aktif sebelumnya._`;
    }

    const updateData = { fitur: { [featureName]: true } };
    await updateGroup(remoteJid, updateData);

    if(featureName == 'promote' || featureName == 'demote' || featureName == 'welcome' || featureName == 'left') {
        return `🚀 _Berhasil mengaktifkan fitur untuk_ *${featureName}*. \n\n_Jika belum melakukan set silakan ketik *.set${featureName}*_`;
    }
    //desc
    if(desc) {
        return `🚀 _Berhasil Mengaktifkan Fitur *${featureName}.*_\n\n${desc}`;
    }
    return `🚀 _Berhasil Mengaktifkan Fitur *${featureName}.*_`;
};

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

        const dataGrub = await findGroup(remoteJid);
        if (!dataGrub) {
            throw new Error("Group data not found");
        }

        // Cek jika konten cocok dengan fitur yang ada
        const feature = featureList.find(({ name }) => 
            content.toLowerCase() === name.toLowerCase()
        );
        
        if (feature) {
            const currentStatus = dataGrub.fitur[feature.name] || false;
            const result = await activateFeature(remoteJid, feature.name, currentStatus, feature.desc);

            if(content.toLowerCase() == 'waktusholat') {
                updateSocket(sock); 
            }

            return await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
        }

        // Jika tidak ada fitur yang cocok, kirim template status fitur
        const template_onchat = createTemplate(dataGrub.fitur);
        await sock.sendMessage(remoteJid, { text: template_onchat }, { quoted: message });
    } catch (error) {
        console.error("Error handling the message:", error);
        // Handling error jika grup data tidak ditemukan atau kesalahan lainnya
        await sock.sendMessage(remoteJid, { text: 'Terjadi kesalahan saat memproses perintah.' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['on'],
    OnlyPremium : false,
    OnlyOwner   : false
};