const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const JavaScriptObfuscator = require('javascript-obfuscator');

const pluginsDir = path.join(process.cwd(), 'plugins'); // Path ke folder plugins
const backupDir = path.join(process.cwd(), 'plugins_backup'); // Path ke backup

// Fungsi untuk mengenkripsi file .js
async function encryptFilesInPlugins() {
    // Buat backup hanya jika belum ada
    if (!fs.existsSync(backupDir)) {
        await fs.copy(pluginsDir, backupDir);
        console.log('Backup dibuat sebelum enkripsi.');
    }

    const files = glob.sync(`${pluginsDir}/**/*.js`); // Cari semua file .js

    for (const file of files) {
        try {
            const code = await fs.readFile(file, 'utf8'); // Baca file asli
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true
            }).getObfuscatedCode(); // Encrypt kode

            await fs.writeFile(file, obfuscatedCode, 'utf8'); // Simpan file terenkripsi
            console.log(`Encrypted: ${file}`);
        } catch (err) {
            console.error(`Failed to encrypt: ${file}`, err);
        }
    }
}

// Fungsi untuk mengembalikan file asli dari backup
async function decryptFilesInPlugins() {
    if (!fs.existsSync(backupDir)) {
        console.log('Backup tidak ditemukan, tidak bisa mengembalikan file.');
        return '❌ _Gagal mengembalikan file, backup tidak ditemukan._';
    }

    await fs.copy(backupDir, pluginsDir, { overwrite: true });
    console.log('File asli telah dikembalikan dari backup.');
    return '✅ _Semua file .js di folder plugins telah dikembalikan dari backup._';
}

// Handler utama untuk command
async function handle(sock, messageInfo) {
    const { remoteJid, message, command } = messageInfo;

    if (command === 'enc') {
        await encryptFilesInPlugins();
        await sock.sendMessage(remoteJid, { text: '✅ _Semua file .js di folder plugins telah dienkripsi. Backup tersimpan di plugins_backup._' }, { quoted: message });
    } else if (command === 'dec') {
        const result = await decryptFilesInPlugins();
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['enc', 'dec'],
    OnlyPremium: false,
    OnlyOwner: true
};
