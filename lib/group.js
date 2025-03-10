const fs            = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
const path          = './database/group.json'; // Lokasi file JSON
const { getCache, setCache, deleteCache } = require('@lib/globalCache');
const { logWithTime }  = require('@lib/utils');

async function readGroup() {
    try {
        let dataGroups;
        const cachedData = getCache(`global-group`);
        if (cachedData) {
            dataGroups = cachedData.data; // Menggunakan data dari cache
        } else {
            if (!await fileExists(path)) {
                await fs.writeFile(path, JSON.stringify({}, null, 2), 'utf8'); // Buat file jika belum ada
            }
            const data = await fs.readFile(path, 'utf8');
            dataGroups = JSON.parse(data);
            setCache(`global-group`, dataGroups);
            logWithTime('READ FILE', `group.json`, 'merah');
        }
        return dataGroups;
    } catch (error) {
        console.error('Error reading group file:', error);
        throw error;
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function saveGroup(data) {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
        deleteCache(`global-group`);  // reset cache
        logWithTime('DELETE CACHE FILE', `group.json`, 'merah');
    } catch (error) {
        console.error('Error saving group file:', error);
        throw error;
    }
}

async function addGroup(id, userData) {
    try {
        const groups = await readGroup();
        if (groups[id]) {
            return false;
        }
        groups[id] = {
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await saveGroup(groups);
        return true;
    } catch (error) {
        console.error('Error adding group:', error);
        return false;
    }
}

async function updateGroup(id, updateData) {
    try {
        const groups = await readGroup();
        if (!groups[id]) {
            return false;
        }

        // Menggabungkan fitur lama dan fitur baru
        const updatedFeatures = {
            ...groups[id].fitur,  // fitur yang sudah ada
            ...updateData.fitur   // fitur yang akan diupdate
        };

        // Memperbarui data grup dengan fitur yang sudah digabung
        groups[id] = {
            ...groups[id],
            fitur: updatedFeatures,  // Tetap mempertahankan fitur lama dan menambahkan yang baru
            updatedAt: new Date().toISOString()
        };

        await saveGroup(groups);
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

// User Block
async function addUserBlock(id, sender) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return false;
        }

        // Jika grup sudah memiliki data, pastikan userBlock adalah array
        if (!Array.isArray(groups[id].userBlock)) {
            groups[id].userBlock = [];
        }

        // Menambahkan sender ke userBlock jika belum ada
        if (!groups[id].userBlock.includes(sender)) {
            groups[id].userBlock.push(sender);
        }

        // Perbarui timestamp
        groups[id].updatedAt = new Date().toISOString();

        await saveGroup(groups);
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

async function isUserBlocked(id, sender) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return false;
        }

        // Pastikan userBlock adalah array sebelum mengecek
        if (!Array.isArray(groups[id].userBlock)) {
            return false;
        }

        // Mengecek apakah sender ada di userBlock
        return groups[id].userBlock.includes(sender);
    } catch (error) {
        console.error('Error checking userBlock:', error);
        return false;
    }
}

async function removeUserFromBlock(id, sender) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return false;
        }

        // Pastikan userBlock adalah array sebelum mencoba menghapus
        if (!Array.isArray(groups[id].userBlock)) {
            return false;
        }

        // Cari index sender di userBlock
        const userIndex = groups[id].userBlock.indexOf(sender);
        if (userIndex === -1) {
            return false;
        }

        // Hapus user dari userBlock
        groups[id].userBlock.splice(userIndex, 1);

        // Simpan perubahan
        await saveGroup(groups);
        return true;
    } catch (error) {
        return false;
    }
}

// Fitur block
async function addFiturBlock(id, command) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return false;
        }

        // Jika grup sudah memiliki data, pastikan userBlock adalah array
        if (!Array.isArray(groups[id].fiturBlock)) {
            groups[id].fiturBlock = [];
        }

        // Menambahkan sender ke userBlock jika belum ada
        if (!groups[id].fiturBlock.includes(command)) {
            groups[id].fiturBlock.push(command);
        }

        // Perbarui timestamp
        groups[id].updatedAt = new Date().toISOString();

        await saveGroup(groups);
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

async function isFiturBlocked(id, command) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return false;
        }

        // Pastikan userBlock adalah array sebelum mengecek
        if (!Array.isArray(groups[id].fiturBlock)) {
            return false;
        }

        // Mengecek apakah sender ada di userBlock
        return groups[id].fiturBlock.includes(command);
    } catch (error) {
        console.error('Error checking fiturBlock:', error);
        return false;
    }
}

async function removeFiturFromBlock(id, command) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return false;
        }

        // Pastikan userBlock adalah array sebelum mencoba menghapus
        if (!Array.isArray(groups[id].fiturBlock)) {
            
            return false;
        }

        // Cari index sender di userBlock
        const userIndex = groups[id].fiturBlock.indexOf(command);
        if (userIndex === -1) {
            return false;
        }

        // Hapus user dari userBlock
        groups[id].fiturBlock.splice(userIndex, 1);

        // Simpan perubahan
        await saveGroup(groups);
        return true;
    } catch (error) {
        return false;
    }
}



async function getUserBlockList(id) {
    try {
        const groups = await readGroup();

        if (!groups[id]) {
            
            return [];
        }

        // Pastikan userBlock adalah array
        if (!Array.isArray(groups[id].userBlock)) {
            return [];
        }

        // Kembalikan daftar userBlock
        return groups[id].userBlock;
    } catch (error) {
        console.error('Error fetching userBlock list:', error);
        return [];
    }
}

async function deleteGroup(id) {
    try {
        const groups = await readGroup();
        if (!groups[id]) {
            return false;
        }
        delete groups[id];
        await saveGroup(groups);
        return true;
    } catch (error) {
        console.error('Error deleting group:', error);
        return false;
    }
}

async function findGroup(id) {
    try {
        const groups = await readGroup();
        return groups[id] || null;
    } catch (error) {
        console.error('Error finding group:', error);
        return null;
    }
}

// Ekspor fungsi
module.exports = {
    readGroup,
    saveGroup,
    addGroup,
    updateGroup,
    deleteGroup,
    findGroup,
    addUserBlock,
    isUserBlocked,
    removeUserFromBlock,
    getUserBlockList,
    addFiturBlock,
    isFiturBlocked,
    removeFiturFromBlock
};
