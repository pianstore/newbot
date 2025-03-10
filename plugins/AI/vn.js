const fs    = require('fs');
const path  = require('path');
const { textToAudio } = require('@lib/features');
const { logCustom }   = require("@lib/logger");
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    
    try {

        if (!content.trim()) {
            return await sock.sendMessage(remoteJid, { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} halo google*_` }, { quoted: message });
        }

        const bufferAudio = await textToAudio(content);

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
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        // Memberi tahu pengguna jika ada kesalahan
        await sock.sendMessage(remoteJid, { text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n${error}` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['vn'],
    OnlyPremium : false, 
    OnlyOwner   : false
};
