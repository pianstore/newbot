const fs    = require('fs');
const path  = require('path');
const ApiAutoresbot     = require('api-autoresbot');
const config            = require("@config");
const api               = new ApiAutoresbot(config.APIKEY);
const { textToAudio }   = require('@lib/features');
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, fullText, pushName } = messageInfo;
    
    let nameCekodam = '';

    if (!fullText.includes("odam")) return true;

    if(content === '') {
        nameCekodam = pushName
    }else{
        nameCekodam = content;
    }

    // Panggil API Kodam
    try {

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const response = await api.get(`/api/game/kodam`);
        if (!response || !response.data) {
            console.error("API response is empty or invalid:", response);
            return false;
        }
        const kodam = response.data;
        const result_kodam = `Nama, ${nameCekodam} , , , Kodam , ${kodam}`;

        const bufferAudio = await textToAudio(result_kodam);

        const baseDir   = process.cwd(); 
        const inputPath = path.join(baseDir, generateUniqueFilename());
        fs.writeFileSync(inputPath, bufferAudio);
        let bufferOriginal = bufferAudio;
        try {
         bufferOriginal = await convertAudioToCompatibleFormat(inputPath);
        } catch{
 
        }
        await sock.sendMessage(remoteJid, { audio: { url : bufferOriginal} , mimetype: 'audio/mp4', ptt: true }, { quoted: message })

    } catch (error) {
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
    Commands: ["kodam", "cekkodam", 'cek','cekkhodam','cekodam'],
    OnlyPremium: false,
    OnlyOwner: false,
};