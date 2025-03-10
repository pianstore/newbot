const ApiAutoresbot = require('api-autoresbot');
const config = require('@config');
const { writeExifImg, sendImageAsSticker } = require('@lib/exif');
const { downloadQuotedMedia, downloadMedia } = require('@lib/utils');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

/**
 * Mengirimkan pesan kesalahan ke pengguna
 * @param {Object} sock - Objek socket
 * @param {string} remoteJid - ID pengguna
 * @param {Object} message - Pesan asli
 * @param {string} errorMessage - Pesan kesalahan
 */
async function sendError(sock, remoteJid, message, errorMessage) {
    await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
}

/**
 * Memproses permintaan watermark untuk media
 * @param {Object} sock - Objek socket
 * @param {Object} messageInfo - Informasi pesan
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted, type } = messageInfo;
    const mediaType = isQuoted ? isQuoted.type : type;

    try {
        const [packname = '', author = ''] = content.split('|').map(s => s.trim());

        // Validasi tipe media
        if (!['image', 'sticker'].includes(mediaType)) {
            return sendError(
                sock,
                remoteJid,
                message,
                `⚠️ _Kirim/Balas gambar/stiker dengan caption *${prefix + command}*_`
            );
        }

        // Validasi konten input
        if (!content.trim()) {
            return sendError(
                sock,
                remoteJid,
                message,
                `_Contoh: *wm az creative*_

_Contoh 1: wm nama_
_Contoh 2: wm youtube | creative_`
            );
        }

        // Unduh media
        const mediaPath = `./tmp/${
            isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message)
        }`;

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        const buffer = fs.readFileSync(mediaPath);
        const stickerBuffer = await processMedia(buffer, mediaType, packname, author);

        // Kirim media sebagai stiker
        await sendSticker(sock, remoteJid, stickerBuffer, packname, author, message);
    } catch (error) {
        await sendError(
            sock,
            remoteJid,
            message,
            `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\nError: ${error.message}`
        );
    }
}

/**
 * Memproses media menjadi buffer stiker
 * @param {Buffer} buffer - Buffer media asli
 * @param {string} mediaType - Jenis media (image/sticker)
 * @param {string} packname - Nama paket stiker
 * @param {string} author - Nama pembuat stiker
 * @returns {Buffer} Buffer stiker
 */
async function processMedia(buffer, mediaType, packname, author) {
    if (mediaType === 'sticker') {
        return buffer;
    } else if (mediaType === 'image') {
        const stickerPath = await writeExifImg(buffer, { packname, author });
        return fs.readFileSync(stickerPath);
    }

    throw new Error('Gagal memproses media menjadi sticker.');
}

/**
 * Mengirimkan buffer sebagai stiker
 * @param {Object} sock - Objek socket
 * @param {string} remoteJid - ID pengguna
 * @param {Buffer} stickerBuffer - Buffer stiker
 * @param {string} packname - Nama paket stiker
 * @param {string} author - Nama pembuat stiker
 * @param {Object} message - Pesan asli
 */
async function sendSticker(sock, remoteJid, stickerBuffer, packname, author, message) {
    try {
        await sendImageAsSticker(sock, remoteJid, stickerBuffer, { packname, author }, message);
    } catch {
        // Alternatif jika gagal
        const webpBuffer = await sharp(stickerBuffer).webp().toBuffer();
        await sendImageAsSticker(sock, remoteJid, webpBuffer, {
            packname: config.sticker_packname,
            author: config.sticker_author,
        }, message);
    }
}

module.exports = {
    handle,
    Commands    : ['wm'],
    OnlyPremium : false,
    OnlyOwner   : false
};