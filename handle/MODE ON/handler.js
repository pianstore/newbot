const fs = require("fs");
const path = require("path");
const { findGroup }             = require("@lib/group");
const { containsBadword }       = require("@lib/badword");
const mess                      = require('@mess');
const spamDetection             = require('@lib/spamDetection');
const badwordDetection             = require('@lib/badwordDetection');
const config                    = require('@config');
const { updateUser }            = require("@lib/users");
const autoAi                    = require('@lib/autoai');
const autoSimi                  = require('@lib/autosimi');
const autoRusuh                 = require('@lib/autorusuh');
const { getGroupMetadata }      = require("@lib/cache");
const { logWithTime, isUrlInText, toText, sendMessageWithMention }    = require('@lib/utils');
const { findMessageById, editMessageById }  = require("@lib/chatManager");
const { sendImageAsSticker } = require('@lib/exif');
const notifiedUsers = new Set();

async function process(sock, messageInfo) {
    const { m, remoteJid, id, sender, pushName, message, isGroup, prefix, command, fullText, type, isQuoted } = messageInfo;
    const messagesDefault = toText(message);
    if (!isGroup) return true; // Abaikan jika bukan grup

    try {
        // Ambil data grup dari database
        const dataGroupSettings = await findGroup(remoteJid);
        if (!dataGroupSettings) {
            logWithTime('System', `Data grup tidak ditemukan atau fitur belum diaktifkan.`);
            return true;
        }
        const { fitur } = dataGroupSettings;

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

        // Fungsi untuk menghapus pesan
        const deleteMessage = async () => {
            await sock.sendMessage(remoteJid, {
                delete: { remoteJid, id, participant: sender }
            });
        };

        // Fungsi untuk memproses kick anggota
        const kickParticipant = async () => {
            await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove');
        };

        // Kirim pesan
        const sendText = async (text, isquoted = false) => {
            if(isquoted) {
                await sendMessageWithMention(sock, remoteJid, text, message);
            }else {
                await sock.sendMessage(remoteJid, { text }, { quoted: message });
            }
        };


        async function handleAction(action, sender) {
            if (action === 'block') {
                await updateUser(sender, { status: "block" });
            } else if (action === 'kick') {
                await kickParticipant();
            } else if (action === 'both') {
                await updateUser(sender, { status: "block" });
                await kickParticipant();
            } else {
                console.warn("Tindakan badword tidak valid:", action);
            }
        }
    
        const isWhatsappLink = fullText.toLowerCase().trim().includes('chat.whatsapp.com');
        // messagesDefault.toLowerCase().trim().includes('chat.whatsapp.com')
        // Anti-link wav2 : Hapus pesan dan kick jika URL whatsapp terdeteksi
        if (!isAdmin && fitur.antilinkwav2 && isWhatsappLink) {
            logWithTime('SYSTEM',`Deteksi fitur Anti-link wav2 : ${fullText}`);
            await deleteMessage();
            await kickParticipant();
            return false;
        }


        // Anti-link wa : Hapus pesan jika URL whatsapp terdeteksi
        if (!isAdmin && fitur.antilinkwa && isWhatsappLink) {
            logWithTime('SYSTEM',`Deteksi fitur antilinkwa : ${fullText}`);
            await deleteMessage();
        }
        

        // Anti-link V2: Hapus pesan + kick pengguna
        if (!isAdmin && fitur.antilinkv2 && isUrlInText(fullText)) {
            logWithTime('SYSTEM',`Deteksi fitur Anti-link V2`);
            await deleteMessage();
            await kickParticipant();
            return false;
        }

         // Anti-link: Hapus pesan jika URL terdeteksi
        if (!isAdmin && fitur.antilink && isUrlInText(fullText)) {
            logWithTime('SYSTEM',`Deteksi fitur antilink`);
            await deleteMessage();
            return false;
        }

        // Deteksi badword: Hapus pesan jika ada kata kasar
        if (!isAdmin && fitur.badword && command !== 'delbadword') {
            const hasBadword = await containsBadword(remoteJid, fullText);
            
            if (hasBadword) {
                logWithTime('SYSTEM',`Deteksi fitur badword`);
                await deleteMessage();

                const result = badwordDetection(sender);
                if (result.status === 'warning') {
                    await sendText(
                        `⚠️ _*BADWORD TERDETEKSI*_\n\n@${sender.split('@')[0]} _telah di peringati_ (${result.totalWarnings}/${config.BADWORD.warning})`, true
                    );
                    return false;
                } 
                
                if (result.status === 'blocked') {
                    await sendText(
                        `⛔ @${sender.split('@')[0]} _Telah diblokir karena mengirim *BADWORD* secara berulang. Hubungi owner jika ada pertanyaan._`
                    , true);

                    // Ambil tindakan berdasarkan konfigurasi
                    const badwordAction = config.BADWORD.action.toLowerCase().trim();

                    try {
                        await handleAction(badwordAction, sender);
                    } catch (error) {
                        console.error("Terjadi kesalahan saat memproses tindakan badword:", error);
                        await sendText("❗ _Terjadi kesalahan, tindakan badword gagal._");
                    }
                }
                    return false;
            }
        }

        // Deteksi antigame
        if (fitur.antigame && command) {
            const Games = ['bj','blackjack','caklontong', 'kodam', 'cekkodam', 'dare','family100','kuismath','math','suit','tebakangka', 'tebakbendera','tebakbom', 'tebakgambar', 'tebakhewan', 'tebakkalimat','tebakkata','tebaklagu','tebak','tebaklirik','tictactoe','truth','ttc','ttt'];
            if (Games.some(game => command.includes(game))) {
                const notifKey = `antigame-${remoteJid}-${sender}`;
                if (!notifiedUsers.has(notifKey)) {
                    notifiedUsers.add(notifKey);
                    await sendText(mess.game.isStop);
                }
                return false;
            }
        }

        // Anti-anti
        const antiFeatures = {
            image: fitur.antifoto,
            video: fitur.antivideo,
            audio: fitur.antiaudio,
            document: fitur.antidocument,
            contact: fitur.anticontact,
            sticker: fitur.antisticker,
            poll: fitur.antipolling,
        };
        
        if (!isAdmin && antiFeatures[type]) {
            logWithTime('SYSTEM',`Deteksi fitur - ${type}`);
            await deleteMessage();
            return false;
        }


        // Deteksi anti-edit
        if (fitur.antiedit && m.isEdited.status) {
            const fullText = m.isEdited.text;
            const idChatEdited = m.isEdited.id;
            if (idChatEdited) {
                const oldMessage = findMessageById(sender, idChatEdited);
                if (oldMessage) {


                    // Kirim pesan deteksi anti-edit
                    await sendText(
                        `⚠️ _*ANTI EDIT DETECTED*_\n\n` +
                        `_Pesan Sebelumnya_ : ${oldMessage.text || ""}`
                    );

                    if(fullText){ // Perharui chat edit
                        editMessageById(
                            sender, 
                            idChatEdited, 
                            fullText
                        );
                        return false;
                    }
                }
            }
        }

        // Deteksi anti-delete
        if (fitur.antidelete && m.isDeleted) {
            const idChatDeleted = m.message.message?.protocolMessage?.key?.id;
            if(idChatDeleted) {
                const oldMessage = findMessageById(sender, idChatDeleted);
                if (oldMessage) {
                    if(oldMessage.type && oldMessage.type == 'sticker'){
                        try {
                            // Ambil direktori kerja saat ini
                            const outputPath    = path.resolve('./', oldMessage.text); // Resolusi path absolut
                            const stickerBuffer = fs.readFileSync(outputPath); // Membaca file dari path
                        
                            // Kirim file sebagai stiker
                            const options = {
                                packname: config.sticker_packname,
                                author: config.sticker_author,
                            };
                            await sendImageAsSticker(sock, remoteJid, stickerBuffer, options, message);
                            await sendText(
                                `⚠️ _*ANTI DELETE DETECTED*_\n\n` +
                                `_Pengirim_ : @${sender.split('@')[0]}\n` +
                                `_Pesan Sebelumnya_ : sticker`
                            , true);

                        } catch (error) {
                            console.error('Error:', error);
                        }
                        return;
                    }

                    // Kirim pesan deteksi anti-delete
                    await sendText(
                        `⚠️ _*ANTI DELETE DETECTED*_\n\n` +
                        `_Pengirim_ : @${sender.split('@')[0]}\n` +
                        `_Pesan Sebelumnya_ : ${oldMessage.text || ""}`
                    , true);
                }
            }
        }

         // Deteksi anti-spam
        if (!isAdmin && typeof fitur.antispamchat === "boolean" && fitur.antispamchat) {
            const result = spamDetection(sender);
            
            if (result.status === 'warning') {
                await sendText(
                    `⚠️ @${sender.split('@')[0]} _Jangan spam, ini peringatan ke-${result.totalWarnings} dari ${config.SPAM.warning}._`,true);
                return false;
            } 
            
            if (result.status === 'blocked') {
                await sendText(
                    `⛔ @${sender.split('@')[0]} _Telah diblokir karena melakukan spam secara berulang. Hubungi owner jika ada pertanyaan._`, true);

                // Ambil tindakan berdasarkan konfigurasi
                const spamAction = config.SPAM.action.toLowerCase().trim();
        
                try {
                    await handleAction(spamAction, sender);
                } catch (error) {
                    console.error("Terjadi kesalahan saat memproses tindakan spam:", error);
                    await sendText("❗ _Terjadi kesalahan, tindakan spam gagal._");
                }
                
                return false;
            }
        }

        // Deteksi anti-virtex (membatasi teks panjang)
        if (!isAdmin && fitur?.antivirtex === true) {
            const isTextMessage = type !== 'video' && type !== 'image';
            const isTextTooLong = messagesDefault.length > 10000;

            if (isTextMessage && isTextTooLong) {
                await sendText(`⚠️ @${sender.split('@')[0]} _Terdeteksi Mengirim Virtex._`, true);
                await deleteMessage();
                return false; // Hentikan eksekusi jika terdeteksi virtex
            }
        }

        // Deteksi auto-ai aktif
        if (fitur?.autoai && command !== 'on' && command !== 'off' && !prefix) {
            const containsAI = fullText.toLowerCase().trim().includes('ai');
            const isQuotedMessageFromBot = isQuoted?.sender === `${config.phone_number_bot}@s.whatsapp.net`;

            // Ambil isi pesan dari kutipan jika pesan berasal dari bot
            const content_old = isQuotedMessageFromBot ? isQuoted.text || isQuoted.content || '' : undefined;

            // Cek apakah tipe pesan adalah 'text' atau 'image'
            if (type === 'text' || type === 'image' || containsAI) {
                await autoAi(sock, messageInfo, content_old);
                return false;
            }
        }

        // Deteksi auto-simi aktif
        if (fitur?.autosimi && command !== 'on' && command !== 'off') {
            const containsSimi = fullText.toLowerCase().trim().includes('simi');
            const isQuotedMessageFromBot = isQuoted?.sender === `${config.phone_number_bot}@s.whatsapp.net`;
            const content_old = isQuotedMessageFromBot ? isQuoted.text || isQuoted.content || '' : undefined;

            if (type === 'text' || containsSimi) {
                await autoSimi(sock, messageInfo, content_old);
                return false;
            }
        }
                
        // Deteksi auto-rusuh aktif
        if (fitur?.autorusuh && command !== 'on' && command !== 'off') {
            const isQuotedMessageFromBot = isQuoted?.sender === `${config.phone_number_bot}@s.whatsapp.net`;
            await autoRusuh(sock, messageInfo, isQuotedMessageFromBot);
            return false;
        }

        // Deteksi onlyadmin
        if (fitur?.onlyadmin) {
            if(!isAdmin) return false; // Hentikan jika bukan admin
        }

    } catch (error) {
        console.error("Terjadi kesalahan pada proses Handler.js:", error.message);
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name    : "Handler",
    priority: 2,
    process
};
