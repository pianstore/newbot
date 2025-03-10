const config        = require('@config');
const fs            = require('fs');
const fsp           = require('fs').promises; 
const usersJson     = './database/users.json'; 
const ownerJsonPath = './database/owner.json';
const MS_IN_A_DAY   = 24 * 60 * 60 * 1000; // Milidetik dalam satu hari
const { getCache, setCache, deleteCache } = require('@lib/globalCache');
const { logWithTime }  = require('@lib/utils');

async function readUsers() {
    try {
        let dataUsers;
        const cachedData = getCache(`global-users`);
        if (cachedData) {
            dataUsers = cachedData.data; // Menggunakan data dari cache
        } else {
            logWithTime('READ FILE', `users.json`, 'merah');
            if (!await fileExists(usersJson)) {
                await fsp.writeFile(usersJson, JSON.stringify({}, null, 2), 'utf8'); // Buat file jika belum ada
            }
            const data = await fsp.readFile(usersJson, 'utf8');
            dataUsers = JSON.parse(data);
            setCache(`global-users`, dataUsers);
        }
        return dataUsers;
    } catch (error) {
        console.error('Error reading users file:', error);
        throw error;
    }
}

// Mengecek apakah file ada
async function fileExists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Menyimpan data ke file JSON
async function saveUsers(data) {
    try {
        await fsp.writeFile(usersJson, JSON.stringify(data, null, 2), 'utf8');
        deleteCache(`global-users`);  // reset cache
        logWithTime('WRITE AND DELETE CACHE global-users', `saveUsers() Di Jalankan`);
    } catch (error) {
        console.error('Error saving users file:', error);
        throw error;
    }
}

// Menambahkan pengguna baru
async function addUser(id, userData) {
    try {
        const users = await readUsers();
        if (users[id]) {
            return false;
        }
        users[id] = {
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await saveUsers(users);
        return true;
    } catch (error) {
        console.error('Error adding user:', error);
        return false;
    }
}

// Memperbarui data pengguna
async function updateUser(id, updateData) {
    try {
        const users = await readUsers();
        if (!users[id]) {
            return false;
        }

        // Pastikan nilai money dan limit tidak kurang dari 0
        if (updateData.money !== undefined) {
            updateData.money = Math.max(0, updateData.money);
        }
        if (updateData.limit !== undefined) {
            updateData.limit = Math.max(0, updateData.limit);
        }

        
        users[id] = {
            ...users[id],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        await saveUsers(users);
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}

// Menghapus pengguna
async function deleteUser(id) {
    try {
        const users = await readUsers();
        if (!users[id]) {
            return false;
        }
        delete users[id];
        await saveUsers(users);
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

// Mencari pengguna berdasarkan ID
async function findUser(id) {
    try {
        const users = await readUsers();
        return users[id] || null;
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
}

// Mencari pengguna berdasarkan ID
async function getInactiveUsers() {
    try {
        const users = await readUsers();

        if (!users || typeof users !== 'object') {
            console.error('Invalid users data');
            return [];
        }

        const sevenDaysAgo = Date.now() - (7 * MS_IN_A_DAY);

        // Filter pengguna yang terakhir diperbarui lebih dari 7 hari yang lalu
        const inactiveUsers = Object.entries(users).filter(([userId, userData]) => {
            if (!userData.updatedAt) return false;
            const updatedDate = new Date(userData.updatedAt);
            return updatedDate.getTime() < sevenDaysAgo;
        });

        // Kembalikan ID pengguna dan updatedAt-nya
        return inactiveUsers.map(([userId, userData]) => ({
            id: userId,
            updatedAt: userData.updatedAt,
        }));
    } catch (error) {
        console.error('Error finding user:', error);
        return [];
    }
}

async function getActiveUsers() {
    try {
        const users = await readUsers();

        if (!users || typeof users !== 'object') {
            console.error('Invalid users data');
            return [];
        }

        const sevenDaysAgo = Date.now() - (7 * MS_IN_A_DAY);

        // Filter pengguna yang terakhir diperbarui dalam 7 hari terakhir
        const activeUsers = Object.entries(users).filter(([userId, userData]) => {
            if (!userData.updatedAt) return false;
            const updatedDate = new Date(userData.updatedAt);
            return updatedDate.getTime() >= sevenDaysAgo; // Aktif dalam 7 hari terakhir
        });

        // Kembalikan ID pengguna dan updatedAt-nya
        return activeUsers.map(([userId, userData]) => ({
            id: userId,
            updatedAt: userData.updatedAt,
        }));
    } catch (error) {
        console.error('Error finding active users:', error);
        return [];
    }
}


// Fungsi untuk memeriksa apakah pengguna adalah owner
function isOwner(remoteJid) {
    const ownerJids = config.owner_number.map(number => `${number}@s.whatsapp.net`);
    return ownerJids.includes(remoteJid);
}

async function isPremiumUser(remoteJid) {
    const data = await findUser(remoteJid);

    // Periksa apakah data ada dan data.premium merupakan string atau tanggal valid
    if (data && data.premium) {
        const premiumDate = new Date(data.premium);
        
        if (!isNaN(premiumDate) && premiumDate > new Date()) {
            return true;
        }
    }

    return false;
}


// Fungsi untuk menambahkan nomor owner
function addOwner(number) {

    // Baca file JSON
    let ownerData;
    try {
        const data = fs.readFileSync(ownerJsonPath, 'utf-8');
        ownerData = JSON.parse(data);
        if (!Array.isArray(ownerData)) {
            throw new Error('Format JSON tidak sesuai (harus berupa array).');
        }
    } catch (err) {
        console.error('Gagal membaca file JSON atau format tidak valid:', err);
        ownerData = []; // Default jika file tidak valid
    }

    // Periksa apakah nomor sudah ada
    if (!ownerData.includes(number)) {
        ownerData.push(number);

        // Tulis kembali data ke file JSON
        try {
            fs.writeFileSync(ownerJsonPath, JSON.stringify(ownerData, null, 4));
            return true;
        } catch (err) {
            console.error('Gagal menyimpan ke file JSON:', err);
            return false;
        }
    } else {
        console.log(`Nomor ${number} sudah ada di owner_number.`);
        return false;
    }
}



// Fungsi untuk menghapus nomor owner
function delOwner(number) {
    // Baca file JSON
    let ownerData;
    try {
        const data = fs.readFileSync(ownerJsonPath, 'utf-8');
        ownerData = JSON.parse(data);
        if (!Array.isArray(ownerData)) {
            throw new Error('Format JSON tidak sesuai (harus berupa array).');
        }
    } catch (err) {
        console.error('Gagal membaca file JSON atau format tidak valid:', err);
        return false;
    }

    // Periksa apakah nomor ada di dalam array
    const index = ownerData.indexOf(number);
    if (index !== -1) {
        // Hapus nomor dari array
        ownerData.splice(index, 1);

        // Tulis kembali data ke file JSON
        try {
            fs.writeFileSync(ownerJsonPath, JSON.stringify(ownerData, null, 4));
            return true;
        } catch (err) {
            console.error('Gagal menyimpan ke file JSON:', err);
            return false;
        }
    } else {
        return false;
    }
}


// Ekspor fungsi
module.exports = {
    readUsers,
    saveUsers,
    addUser,
    updateUser,
    deleteUser,
    findUser,
    isOwner,
    isPremiumUser,
    addOwner,
    delOwner,
    getInactiveUsers,
    getActiveUsers
};
