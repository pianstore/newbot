const { reply } = require('@lib/utils');
const config    = require('@config');

async function handle(sock, messageInfo) {
    const { m } = messageInfo;

    const text = `╭「 𝙎𝘾𝙍𝙄𝙋𝙏 𝘼𝙐𝙏𝙊𝙍𝙀𝙎𝘽𝙊𝙏 」
│
│◧ ᴠᴇʀꜱɪᴏɴ : ${config.version}
│◧ ᴛʏᴘᴇ ᴘʟᴜɢɪɴꜱ
│◧ ɴᴏ ᴇɴᴄ 98%
│◧ ɴᴏ ʙᴜɢ & ɴᴏ ᴇʀʀᴏʀ 
│◧ ʜᴀʀɢᴀ ? 50ᴋ 
│◧ ꜰʀᴇᴇ ᴀᴘɪᴋᴇʏ
│◧ ꜰʀᴇᴇ ᴜᴘᴅᴀᴛᴇ
│◧ ʙɪꜱᴀ ʀᴜɴ ᴅɪ ᴘᴀɴᴇʟ
╰────────────────────────◧

╭「 𝗖𝗮𝗿𝗮 𝗢𝗿𝗱𝗲𝗿 」

◧ ꜱɪʟᴀᴋᴀɴ ᴍᴇʟᴀᴋᴜᴋᴀɴ ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ ᴀᴋᴜɴ ᴘᴀᴅᴀ ᴡᴇʙꜱɪᴛᴇ https://autoresbot.com/register

◧ ꜱᴇᴛᴇʟᴀʜ ɪᴛᴜ ᴋᴜɴᴊᴜɴɢɪ ʜᴀʟᴀᴍᴀɴ https://autoresbot.com/services/script

◧ ʟᴀʟᴜ ᴘɪʟɪʜ ᴘᴀᴋᴇᴛ -> ꜱᴄ ʙᴏᴛ

ᴊɪᴋᴀ ʙᴜᴛᴜʜ ʙᴀɴᴛᴜᴀɴ ʜᴜʙᴜɴɢɪ ᴋᴀᴍɪ ʟᴇᴡᴀᴛ ᴛᴇʟᴇɢʀᴀᴍ (ꜰᴀꜱᴛ ʀᴇꜱᴘᴏɴ)
https://t.me/autoresbot_com`

        await reply(m, text);
}

module.exports = {
    handle,
    Commands    : ['sc','script'],
    OnlyPremium : false,
    OnlyOwner   : false
};
