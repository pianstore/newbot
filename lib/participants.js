const fs                   = require('fs').promises;
const { updateSocket }     = require('@lib/scheduled');
const pathjson_participant = './database/additional/group participant.json';
const { logWithTime }  = require('@lib/utils');
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');

// Mengecek apakah file ada
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}


// Fungsi untuk membaca file JSON
async function readJsonFile() {
    try {
        let currentParticipant;
        const cachedData = getCache(`group-participant`);
        if (cachedData) {
            currentParticipant = cachedData.data; // Menggunakan data dari cache
        } else {
            if (!await fileExists(pathjson_participant)) {
                await fs.writeFile(pathjson_participant, JSON.stringify({}, null, 2), 'utf8'); // Buat file jika belum ada
            }
            const data = await fs.readFile(pathjson_participant, 'utf8');
            currentParticipant = JSON.parse(data);
            setCache(`group-participant`, currentParticipant);
            logWithTime('READ FILE', `group participant.json`, 'merah');
        }
        return currentParticipant
    } catch (err) {
        if (err.code === 'ENOENT') {
            // Jika file tidak ada, buat file baru dengan struktur kosong
            await fs.writeFile(pathjson_participant, JSON.stringify({}));
            return {};
        } else {
            throw err;
        }
    }
}

// Fungsi untuk menulis ke file JSON
async function writeJsonFile(data) {
    try {
        await fs.writeFile(pathjson_participant, JSON.stringify(data, null, 2));
        deleteCache('group-participant')
        logWithTime('DELETE CACHE FILE', `group participant.json`, 'merah');
    } catch (err) {
        throw err;
    }
}

async function setWelcome(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }
    data[remoteJid].add = text || 'Selamat datang di grup!';
    await writeJsonFile(data);
}

async function setLeft(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }
    data[remoteJid].remove = text || 'Selamat jalan, semoga sukses!';
    await writeJsonFile(data);
}

async function setPromote(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }
    data[remoteJid].promote = text || 'Selamat! Anda telah dipromosikan menjadi admin.';
    await writeJsonFile(data);
}

async function setDemote(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }
    data[remoteJid].demote = text || 'Maaf, Anda telah diturunkan dari admin.';
    await writeJsonFile(data);
}


async function setTemplateList(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }
    data[remoteJid].templatelist = text || '1';
    await writeJsonFile(data);
}

async function setTemplateWelcome(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }
    data[remoteJid].templatewelcome = text || '1';
    await writeJsonFile(data);
}


// Fungsi generik untuk mengatur jadwal grup
async function setGroupSchedule(sock, remoteJid, text, property) {
    
    const data = await readJsonFile();
    if (!data[remoteJid]) {
        data[remoteJid] = {};
    }

    if (text.toLowerCase() === "off") {
        if (data[remoteJid][property]) {
            delete data[remoteJid][property]; // Hapus properti
        } else {
            console.log(`${property} tidak ditemukan untuk grup ${remoteJid}.`);
        }
    } else {
        // Simpan waktu dalam UTC
        data[remoteJid][property] = text
    }

    await writeJsonFile(data);
    updateSocket(sock);
}

async function checkMessage(remoteJid, type) {
    // Membaca data dari file JSON
    const data = await readJsonFile();
    if (!data || typeof data !== 'object') {
        throw new Error('Data tidak valid atau gagal dibaca dari file.');
    }

    // Memastikan remoteJid ada dalam data
    if (!data[remoteJid]) {
        return false; // Jika tidak ada, langsung kembalikan false
    }

    // Tipe pesan yang didukung
    const messageTypes = {
        add: 'add',
        remove: 'remove',
        promote: 'promote',
        demote: 'demote',
        templatelist : 'templatelist',
        templatewelcome : 'templatewelcome'
    };

    // Memetakan tipe ke kunci dalam data
    const messageKey = messageTypes[type];
    if (!messageKey) {
        throw new Error(`Tipe yang diberikan tidak valid. Tipe yang didukung: ${Object.keys(messageTypes).join(', ')}`);
    }
    const messageData = data[remoteJid][messageKey];

    return messageData || false;
}

module.exports = { setTemplateList, setTemplateWelcome, setWelcome, setLeft, setPromote, setDemote, setGroupSchedule,  checkMessage};

