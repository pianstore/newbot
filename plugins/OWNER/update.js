const fs = require('fs'); // Untuk manipulasi file
const path = require('path');
const axios = require('axios'); // Untuk HTTP request
const unzipper = require('unzipper'); // Untuk mengekstrak ZIP file
const fse = require('fs-extra'); // Untuk menyalin file dan folder (fs-extra lebih lengkap dari fs)
const { exec } = require("child_process");
const config        = require("@config");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function handle(sock, messageInfo) {
    const { remoteJid, message, content} = messageInfo;

    // Memberikan respons awal
    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    try {
        const version = global.version;
        const serverUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}`; // Ganti dengan URL server Anda

        // Unduh data dari server
        let data;
        try {
            const response = await axios.get(serverUrl);
            data = response.data;
        } catch (error) {
            let errorMessage = `_Gagal mengambil data pembaruan dari server. Silakan coba lagi nanti._`;
            if (error.response) {
                if(error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
            return;
        }

        
        // Jika tidak ada pembaruan, beri tahu pengguna
        if (data.status && data.updates.length === 0) {
            const noUpdatesMessage = `⚠️ _Script sudah menggunakan versi terbaru._\n\n_Version : ${global.version}_`;
            await sock.sendMessage(remoteJid, { text: noUpdatesMessage }, { quoted: message });
            return;
        }

        // Jika ada pembaruan, unduh file ZIP
        let zipData;
        try {
            if(content.toLowerCase() == '-y'){
                const zipUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&update=true`;
                zipData = await axios.get(zipUrl, { responseType: 'arraybuffer' });
                
            }else {
                const version   = data.updates[0].version;
                const noted     = data.updates[0].noted;
                let messageText = `✅ _Update Tersedia_

_Versi Saat Ini_ : ${global.version}
_Versi Tersedia_ : ${version}
            
◧ *List Update Files*\n\n`;
                data.updates[0].files.forEach((item, index) => {
                    messageText += `- ${item.name}\n`;
                });
                messageText += `\n_Catatan Update_ : ${noted}\n\n_Untuk memperbarui script ketik *.update -y*_`
                await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });
                return;
                
            }
            
        } catch (error) {
            const errorMessage = `⚠️ _Gagal mengunduh file pembaruan. Silakan coba lagi nanti._`;
            await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
            console.error('Error downloading update ZIP:', error.message);
            return;
        }

        if(!zipData) return

        // Path tempat menyimpan file ZIP sementara
        const zipFilePath = path.join(process.cwd(), 'updates.zip');
        fs.writeFileSync(zipFilePath, zipData.data); // Simpan file ZIP

        // Menyiapkan untuk mengekstrak file ZIP
        const outputDir = path.join(process.cwd(), 'updates'); // Folder untuk mengekstrak isi ZIP
        fs.mkdirSync(outputDir, { recursive: true });

        // Ekstrak file ZIP ke folder
        try {
            await fs.createReadStream(zipFilePath)
                .pipe(unzipper.Extract({ path: outputDir }))
                .promise();
        } catch (error) {
            const errorMessage = `⚠️ _Gagal mengekstrak file ZIP. Silakan coba lagi nanti._`;
            await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
            console.error('Error extracting ZIP:', error.message);
            return;
        }

        // Hapus file ZIP setelah ekstraksi
        fs.unlinkSync(zipFilePath);

        // Menyalin atau menimpa file yang telah diperbarui ke lokasi yang sesuai
        const updateFilesPath = path.join(process.cwd(), 'updates');
        let filesToUpdate;
        try {
            filesToUpdate = fs.readdirSync(updateFilesPath);
        } catch (error) {
            const errorMessage = `⚠️ _Gagal membaca file pembaruan. Silakan coba lagi nanti._`;
            await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
            console.error('Error reading update files:', error.message);
            return;
        }

        // Menyalin file dan menyesuaikan path sesuai dengan struktur yang diinginkan
        filesToUpdate.forEach(file => {
            const filePath = path.join(updateFilesPath, file);

            // Mengabaikan folder atau file yang tidak perlu
            if (fs.statSync(filePath).isDirectory()) {
                // Jika folder "files" ditemukan, pindahkan isinya ke folder utama
                if (file === 'files') {
                    // Loop melalui isi folder "files"
                    const subDirs = fs.readdirSync(filePath);
                    subDirs.forEach(subDir => {
                        const subDirPath = path.join(filePath, subDir);
                        const targetDir = path.join(updateFilesPath, subDir); // Misalnya menjadi update/libs, update/plugins

                        // Jika subfolder ditemukan, salin semua file ke folder utama
                        if (fs.statSync(subDirPath).isDirectory()) {
                            const filesInSubDir = fs.readdirSync(subDirPath);
                            filesInSubDir.forEach(subFile => {
                                const subFilePath = path.join(subDirPath, subFile);
                                const targetPath = path.join(process.cwd(), subDir, subFile);
                                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                                
                                // Salin dan timpa file jika sudah ada
                                fse.copySync(subFilePath, targetPath, { overwrite: true });
                            });
                        } else {
                            const targetPath = path.join(process.cwd(), subDir);
                            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                            
                            // Salin dan timpa file jika sudah ada
                            fse.copySync(subDirPath, targetPath, { overwrite: true });
                        }
                    });
                }
                return;
            }

            // Untuk file selain folder "files", salin seperti biasa
            const localPath = path.join(process.cwd(), file);
            fs.mkdirSync(path.dirname(localPath), { recursive: true });
            
            // Salin dan timpa file jika sudah ada
            fse.copySync(filePath, localPath, { overwrite: true });
        });

        // Hapus folder 'updates' setelah selesai
        try {
            fse.removeSync(outputDir);
        } catch (error) {
            console.error('Error removing update folder:', error.message);
        }

        // Memberikan pesan sukses
        const successMessage = `✅ _Pembaruan berhasil dilakukan!_ \n\n_Silakan restart server anda atau bisa mengetik *.restart*_`;
        await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
        
    } catch (error) {
        // Menangani error yang tidak terduga
        const errorMessage = `❌ _Gagal memperbarui script. Silakan coba lagi nanti._`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
        console.error('Unexpected error:', error.message);
    }
}

module.exports = {
    handle,
    Commands    : ['update'],
    OnlyPremium : false,
    OnlyOwner   : true
};
