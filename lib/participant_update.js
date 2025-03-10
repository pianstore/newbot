const { checkMessage }      = require("@lib/participants");
const ApiAutoresbot         = require("api-autoresbot");
const config                = require("@config");
const { logWithTime, getCurrentDate, sendMessageWithMentionNotQuoted,sendImagesWithMentionNotQuoted, getCurrentTime, getGreeting, getHari } = require('@lib/utils');
const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache");


async function getWelcomeBuffer(api, type, options) {
  const endpoints = {
    "1": "/api/maker/welcome1",
    "2": "/api/maker/welcome2",
    "3": "/api/maker/welcome3",
    "4": "/api/maker/welcome4",
    "5": "/api/maker/welcome5",
  };

  const endpoint = endpoints[type];
  if (!endpoint) return null;

  return await api.getBuffer(endpoint, options);
}


async function handleDetectBlackList(api, sock, id, number) {
  try {
      const response = await api.get('/api/database/blacklist', {
        number 
      });
      return response.data;
  } catch (error) {
      throw error;  // Optionally re-throw to propagate the error
  }
}


async function handleActiveFeatures(sock, messageInfo, settingGroups) {
  const { id, action, participants, store } = messageInfo;

  if (!id || !action || !participants || participants.length === 0) {
    console.error("Invalid message information provided");
    return;
  }
  
  const { promote = false, demote = false, welcome = false, left = false } = settingGroups;


  const targetNumber  = participants[0];
  const targetMention = `@${targetNumber.split("@")[0]}`;
  const api           = new ApiAutoresbot(config.APIKEY);

  // Detect Blacklist
  if (settingGroups?.detectblacklist && action == 'add') {
    logWithTime('SYSTEM', `Fitur detectblacklist aktif`);
    try {
      const numberTarget = targetNumber?.split("@")[0];
      const result = await handleDetectBlackList(api, sock, id, numberTarget);
  
      if (result?.length > 0) {
        // Copywriting untuk pesan blacklist
        let blackListInfo = `⚠️ *PERINGATAN BLACKLIST* ⚠️\n\n` +
          `_Harap waspada! 🚨_\n` +
          `${targetMention} *telah dilaporkan sebanyak ${result.length} kali.*\n\n` +
          `Berikut detailnya:\n`;
  
        result.forEach((item, index) => {
          blackListInfo += `\n📌 *Laporan ${index + 1}:*\n` +
            `◧ *ID:* ${item.id}\n` +
            `◧ *Catatan:* ${item.noted}\n` +
            `◧ *Tanggal:* ${new Date(item.created_at).toLocaleString()}\n` +
            `------------------------------`;
        });
  
        const customizedMessage = blackListInfo.trim();
        await sendMessageWithMentionNotQuoted(sock, id, customizedMessage);
      } else {
        //console.log('Tidak ada data blacklist yang ditemukan.');
      }
    } catch (error) {
      //console.log('nomor tidak ada di blacklist')
    }
  }

  // Cek setting grub
  const actions = {
      promote : promote,
      demote  : demote,
      remove  : left,
      add     : welcome
  };
if (!actions[action]) {
  logWithTime('SYSTEM', `Fitur ${action} tidak aktif`);
  return
}

  const result = await checkMessage(id, action);
  if (!result) return;

  let typeWelcome;
  const templatewelcome = await checkMessage(id, 'templatewelcome');
  if (templatewelcome) {
    typeWelcome = templatewelcome;
  }else{
    typeWelcome = config.typewelcome;
  }

  const groupMetadata = await getGroupMetadata(sock, id);
  if (!groupMetadata) {
    console.error("Failed to fetch group metadata");
    return;
  }

    const ppUser = await getProfilePictureUrl(sock, targetNumber);
    const ppGroup = await getProfilePictureUrl(sock, id);
    const pushName =
      store.contacts[targetNumber]?.verifiedName ||
      store.contacts[targetNumber]?.notify ||
      `${targetNumber.split("@")[0]}`;

    const { subject, desc, size } = groupMetadata;
    const date      = getCurrentDate();
    const time      = getCurrentTime();
    const greeting  = getGreeting();
    const day       = getHari();

    const replacements = {
      "@name": targetMention,
      "@date": date,
      "@day": day,
      "@desc": desc,
      "@group": subject,
      "@greeting": greeting,
      "@size": size,
      "@time": time,
  };

    let customizedMessage = result;
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key.replace(/@/, "@"), "gi");
        customizedMessage = customizedMessage.replace(regex, value);
    }

    if (["promote", "demote", "remove"].includes(action)) {
      if (actions[action]) {
          await sendMessageWithMentionNotQuoted(sock, id, customizedMessage);
      }
      return;
  }

  if (action === "add" && welcome) {
    if (typeWelcome === "random") {
      const randomTypes = ["1", "2","3","4","5",'text'];
      typeWelcome = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    }

    if (typeWelcome === "text") {
      await sendMessageWithMentionNotQuoted(sock, id, customizedMessage);
      return;
    }

    const buffer = await getWelcomeBuffer(api, typeWelcome, {
      pp: ppUser,
      name: pushName,
      gcname: subject,
      member: size,
      ppgc: ppGroup,
      desk: desc,
      bg: config.bgwelcome2,
    });

    if (buffer) {
      await sendImagesWithMentionNotQuoted(sock, id, buffer, customizedMessage);
    } else {
      console.warn("Unhandled typewelcome or missing buffer");
    }
    return;
  }
}

module.exports = { handleActiveFeatures };
