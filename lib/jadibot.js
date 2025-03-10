const fs    = require('fs');
const path  = require('path');
const fsp   = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
const pathJson = './database/jadibot.json'; // Lokasi file JSON
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { Boom }                  = require("@hapi/boom");
const qrcode                    = require('qrcode-terminal');
const pino                      = require("pino");
const logger                    = pino({ level: "silent" });
const { connectToWhatsApp }     = require('@lib/connection');
const { logWithTime, success, danger }   = require('@lib/utils');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Path folder untuk menyimpan sesi
const SESSION_PATH = './session/';

async function startNewSession(masterSessions, senderId, type_connection) {
    const sessionFolder = path.join(SESSION_PATH, senderId);

    // Pastikan folder session ada
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
    }

    const { state, saveCreds }  = await useMultiFileAuthState(sessionFolder);
    const { version }           = await fetchLatestBaileysVersion();

     const sock = makeWASocket({
        version,
        logger: logger,
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    if (!sock.authState.creds.registered && type_connection == 'pairing') {
            const phoneNumber = senderId;
            await delay(4000);
            const code = await sock.requestPairingCode(phoneNumber.trim());
            const textResponse = `⏳ _Jadibot ${senderId}_\n
_Code Pairing :_ ${code}`;
            await masterSessions.sock.sendMessage(masterSessions.remoteJid, { text: textResponse }, { quoted: masterSessions.message });
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr != null && type_connection == 'qr') {
            logWithTime('SYSTEM',`Menampilkan QR`);
            await masterSessions.sock.sendMessage(masterSessions.remoteJid, { text: 'Menampilkan QR'  }, { quoted: masterSessions.message });
        
            qrcode.generate(qr, { small: true }, (qrcodeStr) => {
                console.log(qrcodeStr);
            });
        }

        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            switch (reason) {
                case DisconnectReason.badSession:
                    return danger('Jadibot',`Bad Session File, Start Again ...`); 
                    break;

                case DisconnectReason.connectionClosed:
                    return danger('Jadibot',`Connection closed, reconnecting....`)
                    break;

                case DisconnectReason.connectionLost:
                    return danger('Jadibot',`Connection Lost from Server, reconnecting...`)
                    break;

                case DisconnectReason.connectionReplaced:
                    return danger('Jadibot',`Connection Replaced, Another New Session Opened, Please Restart Bot`)
                    break;

                case DisconnectReason.loggedOut:
                    return danger('Jadibot',`Perangkat Terkeluar, Silakan Lalukan Scan/Pairing Ulang`)
                    
                    break;

                case DisconnectReason.restartRequired:
                    logWithTime('SYSTEM',`Restart Required, Restarting..`);
                    await connectToWhatsApp(`session/${senderId}`);
                    return
            
                    break;

                case DisconnectReason.timedOut:
                    return danger('Jadibot',`Connection TimedOut, Reconnecting...`)
                    break;

                default:
                    return danger('Jadibot',`Unknown DisconnectReason: ${reason}|${connection}`)
                    break;
            }
        
        } else if (connection === 'open') {
            success('SYSTEM', 'JADIBOT TERHUBUNG');
            await masterSessions.sock.sendMessage(masterSessions.remoteJid, { text: `✅ _Berhasil! Nomor *${senderId}* telah menjadi bot._`  }, { quoted: masterSessions.message });
        }

    });

    return sock;
}

async function fileExists(path) {
    try {
        await fsp.access(path);
        return true;
    } catch {
        return false;
    }
}

async function listJadibot() {
    if (!await fileExists(pathJson)) {
        await fsp.writeFile(pathJson, JSON.stringify({}, null, 2), 'utf8'); // Buat file jika belum ada
    }
    const data = await fsp.readFile(pathJson, 'utf8');
    return JSON.parse(data);
}

async function deleteJadibot(number) {
    let jadibots = await listJadibot();
    if (jadibots[number]) {
        delete jadibots[number];
        await fsp.writeFile(pathJson, JSON.stringify(jadibots, null, 2), 'utf8');
        return true;
    } else {
        console.log('Number not found');
        return false;
    }
}

async function updateJadibot(number, status) {
    let jadibots = await listJadibot();
    if (jadibots[number]) {
        jadibots[number].status = status;
    } else {
        jadibots[number] = { status: status };
    }
    await fsp.writeFile(pathJson, JSON.stringify(jadibots, null, 2), 'utf8');
    return true;
}

module.exports = { startNewSession, listJadibot, deleteJadibot, updateJadibot };

