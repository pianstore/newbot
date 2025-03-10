const config        = require('@config');
const path          = require('path')
const chalk         = require('chalk');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { Boom }                  = require("@hapi/boom");
const qrcode                    = require('qrcode-terminal');
const pino                      = require("pino");
const logger                    = pino({ level: "silent" });
const store                     = makeInMemoryStore({ logger })
const { updateSocket }          = require('@lib/scheduled');
const { processMessage, participantUpdate } = require('../autoresbot');

const {  createBackup, getnumberbot, clearDirectory, logWithTime, setupSessionDirectory, isQuotedMessage, removeSpace, restaring, success, danger, sleep, sendMessageWithMentionNotQuoted, validations }   = require('@lib/utils');
clearDirectory('./tmp');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let qrCount = 0;
async function connectToWhatsApp(folder = 'session') {
    logWithTime('System',`connectToWhatsApp for ${folder}`);


    let phone_number_bot = '';

    for (const { key, validValues, validate, errorMessage } of validations) {
        const value = config[key]?.toLowerCase();
        if (validValues && !validValues.includes(value)) {
            return danger('Error config.js', errorMessage);
        }
        if (validate && !validate(config[key])) {
            return danger('Error config.js', errorMessage);
        }
    }

    const sessionDir = path.join(process.cwd(), folder);

    const { state, saveCreds }  = await useMultiFileAuthState(sessionDir);
    const { version }           = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: logger,
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    if (!sock.authState.creds.registered && config.type_connection.toLowerCase() == 'pairing') {
        if(folder != 'session') { // jadibot
            logWithTime('Jadibot',`Koneksi "${folder}" terputus`, 'merah');
            return false;
        }
        const phoneNumber = config.phone_number_bot;
        await delay(4000);
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(chalk.blue('PHONE NUMBER: '), chalk.yellow(phoneNumber));
        console.log(chalk.blue('CODE PAIRING: '), chalk.yellow(code));
    }

    sock.ev.on('creds.update', saveCreds);

    setupSessionDirectory(sessionDir);


    store.bind(sock.ev);

    sock.ev.on('contacts.update', (contacts) => { // UPDATE KONTAK
        contacts.forEach(contact => {
            store.contacts[contact.id] = contact;
        });
        
    });

    sock.ev.on('messages.upsert', async (m) => { // CHAT MASUK

        try {

            if (!m || !m.messages || !m.messages[0]) {
                danger('System', `Pesan tidak valid`)
                return;
            }
            if (m.type === 'append') return;

            const messageTimestamp  = m.messages[0].messageTimestamp;
            const message           = m.messages[0];
            const key               = message.key || {};
            const remoteJid         = key.remoteJid || '';
            const fromMe            = key.fromMe || false;
            const id                = key.id || false;
            const participant       = key.participant || ''; // Untuk pesan dari grup
            const pushName          = message.pushName || 'Unknown';
            const isGroup           = remoteJid.endsWith('@g.us'); // Cek apakah pesan dari grup
            const sender            = isGroup ? participant : remoteJid;
            const isQuoted          = isQuotedMessage(message); // pesan yang mengutip pesan lain
            const isEdited          =  m.messages[0]?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || m.messages[0]?.message?.protocolMessage?.editedMessage?.conversation || m.messages[0]?.message?.editedMessage || null;
            const isDeleted         = m.messages[0]?.message?.protocolMessage?.type === 0;
            if (remoteJid == "status@broadcast") return false; // jika ada story / status
            if(remoteJid.includes('@newsletter')) return false; // jika di saluran

            let objisEdited = {};
            if (isEdited) {
                const messageId = m.messages[0]?.message?.protocolMessage?.key?.id;
                objisEdited = {
                    status: true,
                    id: messageId || null,
                    text: isEdited
                };
            }

            let content     = '';
            let messageType = '';

            // Cek apakah pesan valid
            if (message && message.message) {
                const rawMessageType = Object.keys(message.message)[0];
                
                // Mapping tipe pesan menjadi kategori sederhana
                messageType = 
                    rawMessageType === 'conversation' || rawMessageType === 'extendedTextMessage' || rawMessageType === 'senderKeyDistributionMessage' 
                        ? 'text' :
                    rawMessageType === 'imageMessage' 
                        ? 'image' :
                    rawMessageType === 'videoMessage' 
                        ? 'video' :
                    rawMessageType === 'stickerMessage' 
                        ? 'sticker' :
                    rawMessageType === 'audioMessage' 
                        ? 'audio' :
                    rawMessageType === 'documentMessage' 
                        ? 'document' :
                    rawMessageType === 'contactMessage' 
                        ? 'contact' :
                    rawMessageType === 'locationMessage' 
                        ? 'location' :

                    rawMessageType === 'reactionMessage' 
                        ? 'reaction' :

                    rawMessageType === 'templateButtonReplyMessage' 
                        ? 'button_reply' :

                    rawMessageType === 'messageContextInfo' 
                    ? 'poll' :
                    
                    'unknown'; // Jika tidak cocok dengan tipe apa pun


                // Ambil isi pesan berdasarkan tipe
                content = 
                    messageType === 'text' 
                        ? (message.message.conversation || message.message.extendedTextMessage?.text || '') :
                    messageType === 'image' 
                        ? (message.message.imageMessage?.caption || 'No caption') :
                    messageType === 'video' 
                        ? (message.message.videoMessage?.caption || 'No caption') :
                    messageType === 'button_reply' 
                        ? message.message.templateButtonReplyMessage?.selectedId || '' :
                    messageType === 'poll' 
                    ? message.message.pollCreationMessageV3?.name || '' :
                    ''; // Default kosong

            
            } else {
                return console.log(chalk.redBright('Message atau message.message tidak terdefinisi'));
            }

            content = removeSpace(content);
            let command = content.trim().split(' ')[0].toLowerCase();
            const usedPrefix = config.prefix.find(p => command.startsWith(p)); // Cari prefix yang cocok
            command = usedPrefix
            ? command.slice(usedPrefix.length).trim().split(/\s+/)[0] // Ambil kata pertama setelah prefix
            : config.status_prefix
                ? false
                : command.trim().split(/\s+/)[0]; // Ambil kata pertama jika tidak ada prefix
        
            const contentWithoutCommand = usedPrefix
            ? content.trim().slice(usedPrefix.length + command.length).trim()
            : content.trim().slice(command.length).trim();

            /* ---- Struktur lengkap informasi pesan --- */
            const quotedMessage = isQuoted ? {text: message.message.extendedTextMessage.contextInfo.quotedMessage?.conversation || '', sender: message.message.extendedTextMessage.contextInfo.participant || '', id: message.message.extendedTextMessage.contextInfo.stanzaId || '',}: null;
            const ArraymentionedJid = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid || false;
         

            const messageInfo = {
                id              : id, // ID unik pesan
                timestamp       : messageTimestamp, // Timestamp pesan
                sender          : sender, // Nomor pengirim
                pushName        : pushName, // Nama pengirim
                prefix          : usedPrefix ? usedPrefix : '', // prefix atau awalan
                isGroup         : isGroup, // Apakah dari grup
                fromMe          : fromMe, // Apakah pesan dikirim oleh bot
                remoteJid       : remoteJid, // ID chat
                type            : messageType, // Tipe pesan (text, image, video, dll.)
                command         : command, // perintah
                content         : contentWithoutCommand, // Isi pesan tanpa command
                fullText        : content, // pesan masuk
                isQuoted        : isQuoted, // Apakah pesan mengutip,
                quotedMessage   : quotedMessage, // Data pesan yang dikutip (jika ada)
                mentionedJid    : ArraymentionedJid, // orang yang di tag jika ada
                message         : message, // Object utama
                m               : { remoteJid, key, message, sock, isDeleted, isEdited : objisEdited, m }
            };
            /* --------------------- Send Message ---------------------- */
            try {
                
                if(config.autoread && !isGroup) {
                    await sock.readMessages([key]);
                }
                const validPresenceUpdates = ["unavailable", "available", "composing", "recording", "paused"];
                if (validPresenceUpdates.includes(config?.PresenceUpdate)) {
                    await sock.sendPresenceUpdate(config.PresenceUpdate, remoteJid);
                } else {
                    logWithTime('System',`PresenceUpdate Invalid: ${config?.PresenceUpdate}`);
                }

                await processMessage(sock, messageInfo);
                
            } catch (error) {
                danger(command, `Terjadi kesalahan saat memproses pesan: ${error}`)
            }
        } catch (error) {
            console.log(chalk.redBright(`Error dalam message upsert: ${error.message}`));
        }

    });

    

    sock.ev.on("group-participants.update", async (m) => { // PERUBAHAN DI GRUB

        if (!m || !m.id || !m.participants[0] || !m.action) {
            logWithTime('System',`Participant tidak valid`);
            return;
        }
        const messageInfo = {
            id           : m.id,
            participants : m.participants,
            action       : m.action,
            store
        }

        try {
            await participantUpdate(sock, messageInfo);

        } catch (error) {
            console.log(chalk.redBright(`Terjadi kesalahan di participant Update: ${error}`));
        }
    });

    sock.ev.on("call", async (calls) => { // Ada yang call/videocall di chat pribadi
        if(!config.anticall) return; // jika false
        for (let call of calls) {
            if (!call.isGroup && call.status === "offer") {
            const callType      = call.isVideo ? "VIDEO" : "SUARA";
            const userTag       = `@${call.from.split("@")[0]}`;
            const messageText   = `⚠️ _BOT TIDAK DAPAT MENERIMA PANGGILAN ${callType}._\n
_MAAF ${userTag}, KAMU AKAN DI *BLOCK*._
_Silakan Hubungi Owner Untuk Membuat Block!_
_Website: autoresbot.com/contact_`;

            logWithTime('System',`Call from ${call.from }`);

            await sendMessageWithMentionNotQuoted(sock, call.from, messageText);
            await sleep(2000);
            await sock.updateBlockStatus(call.from, "block");
        }
        }
    });

    sock.ev.on("connection.update", async (update) => { // PERUBAHAN KONEKSI
        logWithTime('System',`Koneksi Update ...`);

        if(sock && sock.user && sock.user.id) {
            global.phone_number_bot = getnumberbot(sock.user.id);
            phone_number_bot        = getnumberbot(sock.user.id);
        }

        const { connection, lastDisconnect, qr } = update;
        if (qr != null && config.type_connection.toLowerCase() == 'qr') {
            if(folder != 'session') { // jadibot
                logWithTime('Jadibot',`Koneksi "${folder}" terputus`, 'merah');
                return false;
            }
            qrCount++; // Tambah 1 setiap kali QR ditampilkan
            logWithTime('System',`Menampilkan QR`);
            qrcode.generate(qr, { small: true }, (qrcodeStr) => {
                console.log(qrcodeStr);
            });
            success('QR', `Silakan scan melalui aplikasi whatsapp!. (Try ${qrCount}/5)`);

            if (qrCount >= 5) {
                danger('Timeout', 'Terlalu banyak menampilkan qr, silakan coba kembali');
                process.exit(0); // Menghentikan proses
            }
        }

        if (connection === 'close') {
            await updateSocket(sock); // Update sock scheduled
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            switch (reason) {
                case DisconnectReason.badSession:
                    console.log(chalk.redBright(`Bad Session File, Start Again ...`));
                    logWithTime('System',`Bad Session File, Start Again ...`);
                    return await connectToWhatsApp(folder)
                    break;

                case DisconnectReason.connectionClosed:
                    console.log(chalk.redBright(`Connection closed, reconnecting....`));
                    logWithTime('System',`Connection closed, reconnecting....`);
                    return await connectToWhatsApp(folder)
                    break;

                case DisconnectReason.connectionLost:
                    console.log(chalk.redBright(`Connection Lost from Server, reconnecting...`));
                    logWithTime('System',`Connection Lost from Server, reconnecting...`);
                    return await connectToWhatsApp(folder)
                    break;

                case DisconnectReason.connectionReplaced:
                    console.log(chalk.redBright(`Connection Replaced, Another New Session Opened, Please Restart Bot`));
                    logWithTime('System',`Connection Replaced, Another New Session Opened, Please Restart Bot`);
                    if (sock) { // Jika instance koneksi ada
                        await sock.logout(); // Hapus autentikasi dan putuskan koneksi
                    }
                    await delay(4000);
                    return await connectToWhatsApp(folder)
                    break;

                case DisconnectReason.loggedOut:
                    console.log(chalk.redBright(`Perangkat Terkeluar, Hapus Folder Session dan Lalukan Scan/Pairing Ulang`));
                    logWithTime('System',`Perangkat Terkeluar, Hapus Folder Session dan Lalukan Scan/Pairing Ulang`);

                    if(folder != 'session' && phone_number_bot){ // jadibot
                        const { updateJadibot } = require('@lib/jadibot');
                        await updateJadibot(phone_number_bot, 'logout');
                    }
                    break;

                case DisconnectReason.restartRequired:
                    logWithTime('System',`Restart Required, Restarting..`)
                    return await connectToWhatsApp(folder)
                    break;

                case DisconnectReason.timedOut:
                    console.log(chalk.redBright(`Connection TimedOut, Reconnecting...`));
                    logWithTime('System',`Connection TimedOut, Reconnecting...`)
                    return await connectToWhatsApp(folder)
                    break;

                default:
                    console.log(chalk.redBright(`Unknown DisconnectReason: ${reason}|${connection}`));
                    logWithTime('System',`Unknown DisconnectReason: ${reason}|${connection}`)
                    if(folder != 'session' && phone_number_bot){ // jadibot
                        const { updateJadibot } = require('@lib/jadibot');
                        await updateJadibot(phone_number_bot, 'baned');
                    }
                    return await connectToWhatsApp(folder);
                    break;
            }

        } else if (connection === 'open') {
            const isSession = folder === 'session';
            success(isSession ? 'System' : 'Jadibot', 'Koneksi Terhubung');

            if (!isSession && phone_number_bot) {
                const { updateJadibot } = require('@lib/jadibot');
                await updateJadibot(phone_number_bot, 'active');
            }

            const isRestart = await restaring();
            if (isRestart) {
                if (isSession) {
                    await sock.sendMessage(isRestart, { text: "_Bot Berhasil di restart_" });
                }
            } else if (isSession) {
                await sock.sendMessage(`${config.phone_number_bot}@s.whatsapp.net`, { text: "_Bot Connected_" });
            }

            try {
                await updateSocket(sock); // Update sock scheduled
            } catch(error) {
                console.log(chalk.redBright(`Error dalam menjalan updateSocket atau waktuSholat : ${error.message}`));
            }
        
            try {
                if (config.autobackup && folder == 'session') {
                    const backupFilePath = await createBackup();
                    const filename = 'autoresbot backup.zip';
                    const documentPath = backupFilePath;
            
                    await sock.sendMessage(
                        `${config.owner_number[0]}@s.whatsapp.net`,
                        {
                            document: { url: documentPath },
                            fileName: filename,
                            mimetype: 'application/zip'
                        }
                    );
            
                    // Log keberhasilan backup
                    logWithTime('System', `Backup berhasil: ${backupFilePath}`);
                } else {
                    // Log jika autobackup tidak diaktifkan
                    logWithTime('System', 'Autobackup tidak diaktifkan.');
                }
            } catch (error) {
                // Tangani error dengan memberikan informasi ke log
                console.error('Terjadi error saat proses backup:', error.message);
            }
    
        }
    });



    return sock;
}

module.exports = { connectToWhatsApp } 