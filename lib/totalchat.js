const fs = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
const JSON_PATH = './database/additional/totalchat.json'; // Konstanta untuk path file JSON
const { logWithTime }  = require('@lib/utils');

const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});


const writeQueue    = [];
let isWriting       = false;

// Menyimpan data ke file JSON
async function saveJsonFiles(data) {
    return new Promise((resolve, reject) => {
        writeQueue.push({ data, resolve, reject });
        processQueue();
    });
}
async function processQueue() {
    if (isWriting || writeQueue.length === 0) return;
    
    isWriting = true;
    const { data, resolve, reject } = writeQueue.shift();
    
    try {
        await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
        logWithTime('WRITE FILE', `processQueue() ke DB totalchat.json`, 'merah');
        resolve();
    } catch (error) {
        console.error(`[saveJsonFiles] Error saving file: ${JSON_PATH}`, error);
        reject(error);
    } finally {
        isWriting = false;
        processQueue();
    }
}

// async function saveJsonFiles(data) {
//     try {
//         await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
//     } catch (error) {
//         console.error(`[saveJsonFiles] Error saving file: ${JSON_PATH}`, error);
//         throw error;
//     }
// }


// Mengecek apakah file ada
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Membaca data dari file JSON
async function readJsonFiles() {
    try {
        if (!await fileExists(JSON_PATH)) {
            await fs.writeFile(JSON_PATH, JSON.stringify({}, null, 2), 'utf8'); // Buat file jika belum ada
        }
        const data = await fs.readFile(JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[readJsonFiles] Error reading file: ${JSON_PATH}`, error);
        throw error;
    }
}


// Menambahkan chat untuk pengguna dalam grup
async function incrementUserChatCount(groupId, userId, totalchat) {
    try {
        const groups = await readJsonFiles();

        if (!groups[groupId]) {
            // Jika grup belum ada, buat grup baru
            groups[groupId] = {
                createdAt: today,
                members: {},
            };
        }


        if (!groups[groupId].members[userId]) {
            // Jika pengguna belum ada di grup, inisialisasi data pengguna
            groups[groupId].members[userId] = 0;
        }

        // Tambahkan jumlah chat untuk pengguna
        groups[groupId].members[userId] += totalchat;

        // Simpan perubahan ke file
        await saveJsonFiles(groups);
    } catch (error) {
        console.error(`[incrementUserChatCount] Error updating chat count for group "${groupId}" and user "${userId}":`);
    }
}

// Mendapatkan total chat dari pengguna dalam grup
async function getUserChatCount(groupId, userId) {
    try {
        const groups = await readJsonFiles();

        if (!groups[groupId] || !groups[groupId].members[userId]) {
            return 0; // Jika grup atau pengguna tidak ditemukan, kembalikan 0
        }

        return groups[groupId].members[userId];
    } catch (error) {
        console.error(`[getUserChatCount] Error getting chat count for group "${groupId}" and user "${userId}":`);
        return 0;
    }
}

// Mendapatkan total chat dari semua pengguna dalam grup
async function getTotalChatPerGroup(groupId) {
    try {
        const groups = await readJsonFiles();

        if (!groups[groupId]) {
            return {}; // Jika grup tidak ditemukan, kembalikan objek kosong
        }

        return groups[groupId].members;
    } catch (error) {
        console.error(`[getTotalChatPerGroup] Error getting total chat for group "${groupId}":`, error);
        return {};
    }
}

// Fungsi untuk mereset total chat pada sebuah grup
async function resetTotalChatPerGroup(groupId) {
    try {
        const groups = await readJsonFiles();

        // Periksa apakah grup ada
        if (!groups[groupId]) {
            console.error(`[resetTotalChatPerGroup] Group "${groupId}" not found.`);
            return false; // Indikasi grup tidak ditemukan
        }

        groups[groupId] = {
            createdAt: today,
            members: {},
        };

        // Simpan perubahan kembali ke file JSON
        await saveJsonFiles(groups);
        return true; // Indikasi berhasil
    } catch (error) {
        console.error(`[resetTotalChatPerGroup] Error resetting total chat for group "${groupId}":`, error);
        return false; // Indikasi terjadi error
    }
}

// Ekspor fungsi
module.exports = {
    incrementUserChatCount,
    getUserChatCount,
    getTotalChatPerGroup,
    resetTotalChatPerGroup
};