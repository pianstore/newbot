/* ⚠️ DILARANG EDIT FILE INI ⚠️

╔═════════════════════════════════╗
║     🛠️ Informasi Script
╠═════════════════════════════════╣
║ 📦 Version   : 4.x.x              
║ 👨‍💻 Developer : Azhari Creative    
║ 🌐 Website   : autoresbot.com   
╚═════════════════════════════════╝

⚠️ DILARANG EDIT FILE INI ⚠️

*/

const os        = require('os');
const chalk     = require('chalk');
const figlet    = require('figlet');
const axios     = require('axios');
const config    = require("@config");
const crypto    = require('crypto');
const fs        = require('fs');
const path      = require('path');
const { success, danger, encryptData, isLocal, logWithTime }   = require('@lib/utils');
const { logCustom }     = require("@lib/logger");

const TERMINAL_WIDTH = process.stdout.columns || 45; // Default ke 80 jika tidak tersedia
const ALIGNMENT_PADDING = 5;

const horizontalLine = (length = TERMINAL_WIDTH, char = '=') => char.repeat(length);

let cachedIP = null;
const getPublicIP = async () => {
    try {
        // Jika IP sudah ada di cache, gunakan dari cache
        if (cachedIP) {
            return cachedIP;
        }
        const response = await axios.get('https://api.ipify.org?format=json');
        cachedIP = response.data.ip; // Simpan IP ke dalam cache
        return cachedIP;
    } catch (error) {
        throw new Error('Tidak dapat mengambil IP publik');
    }
};

const getServerSpecs = async () => ({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`,
    uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
    publicIp :  await getPublicIP(),
    mode : config.mode
});

const getStatusApikey = async () => {
    try {
        const response = await axios.get(`https://api.autoresbot.com/check_apikey?apikey=${config.APIKEY}`);
        const { username, max_limit, request_count } = response.data || {};
        if (max_limit === 0) return chalk.green('Unlimited');
        if (username) return `${request_count} / ${max_limit}`;
        return chalk.yellow('Unknown');
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            const errorCode = data?.error_code;
            const errorMessage = data?.message;

            // Tangani status kode HTTP tertentu
            if (status === 403) return status;
            if (status === 404) return chalk.redBright('Not Found: Invalid endpoint or resource');
            if (status === 401) return chalk.redBright('Unauthorized: API key is missing or invalid');

            // Tangani error kode khusus dalam response
            if (errorCode === 'LIMIT_REACHED') return chalk.redBright(`LIMIT_REACHED (${errorMessage || 'No message'})`);
            if (errorCode === 'INVALID_API_KEY') return chalk.redBright('INVALID_API_KEY');
        }
        return chalk.red('Error fetching API status');
    }
};

async function showServerInfo(e={}){const{title:o="RESBOT",borderChar:n="=",color:a="cyan"}=e,t={horizontalLayout:TERMINAL_WIDTH>40?"default":"fitted",width:Math.min(TERMINAL_WIDTH-4,40)},i=`\n${chalk[a](horizontalLine(TERMINAL_WIDTH,n))}\n${chalk[a](figlet.textSync(o,t))}\n${chalk[a](horizontalLine(TERMINAL_WIDTH,n))}\n`,l=await getServerSpecs(),r=await getStatusApikey();if(403==r){console.log("--------------------"),danger("Error ⚠️","Forbidden: API key is not authorized"),danger("Error ⚠️",`Solusi: Tambahkan ip anda ${await getPublicIP()} ke dalam whitelist`),success("IP",await getPublicIP()),success("Info","Kunjungi linknya dan tambahkan ip kamu"),console.log("https://autoresbot.com/services/rest-api"),console.log("--------------------");const e=e=>new Promise((o=>setTimeout(o,e)));return await e(3e4),void process.exit()}const c=["◧ Hostname","◧ Platform","◧ Architecture","◧ Total Memory","◧ Free Memory","◧ Uptime","◧ Public IP","◧ Mode"],s=Object.values(l),h=Math.max(...c.map((e=>e.length))),I=c.map(((e,o)=>`${chalk.green(e.padEnd(h+ALIGNMENT_PADDING))}: ${s[o]}`)).join("\n"),u=`\n${chalk.yellow.bold("◧ Info Script :")}\n${chalk.green("Version :")} Resbot ${global.version}\n${chalk.green("API Key :")} ${r}\n${chalk.yellow.bold("------------------")}\n${chalk.yellow.bold("◧ Server Specifications :")}\n${I}\n`,d=`\n${chalk[a](horizontalLine(TERMINAL_WIDTH,n))}\n${chalk[a].bold(" ◧ Thank you for using this script! ◧ ")}\n${chalk[a](horizontalLine(TERMINAL_WIDTH,n))}\n`;console.log(i+u+d)}
const _0x13f1c9=_0x4529;function _0x4f26(){const _0x345874=['14geEHXA','Script\x20ini\x20terdeteksi\x20bukan\x20original\x20dari\x20autoresbot.\x20Silakan\x20download\x20di\x20website\x20resmi\x20autoresbot.com','stdin','Masukkan\x20kode:','2251096xTUCcD','613982doZfSD','baned','--------------------','security.txt','35970IqbsBG','from','@lib/jadibot','md5','@lib/connection','655WvrlyL','info','status','Jadibot','Script\x20ini\x20terdeteksi\x20bukan\x20original\x20dari\x20autoresbot.\x20Silakan\x20download\x20di\x20website\x20resmi\x20autoresbot','Failed','session/','readline','37023410wLzXbq','log','Kode\x20tidak\x20valid.\x20Silakan\x20coba\x20lagi','127.0.0.1','3747112zYmldR','utf8','digest','Kunjungi\x20linknya\x20dan\x20dapatkan\x20kode\x20lalu\x20paste\x20dibawah','readFileSync','hex','platform','Verif','toString','stdout','writeFileSync','update',')\x20==\x20key(','3037716rqugDQ','871137XyUUmN','existsSync','Memulai\x20koneksi\x20jadibot\x20','fileContent(','Error','createHash','2ZGtZpC'];_0x4f26=function(){return _0x345874;};return _0x4f26();}function _0x4529(_0x3f7d0a,_0x47e5ee){const _0x4f2641=_0x4f26();return _0x4529=function(_0x45299d,_0x3aa860){_0x45299d=_0x45299d-0xb1;let _0x2e232a=_0x4f2641[_0x45299d];return _0x2e232a;},_0x4529(_0x3f7d0a,_0x47e5ee);}(function(_0x5973ec,_0x32c1b7){const _0x3e9508=_0x4529,_0x17c9f7=_0x5973ec();while(!![]){try{const _0x5ca16b=parseInt(_0x3e9508(0xc2))/0x1*(-parseInt(_0x3e9508(0xbc))/0x2)+parseInt(_0x3e9508(0xb6))/0x3+-parseInt(_0x3e9508(0xc1))/0x4+-parseInt(_0x3e9508(0xcb))/0x5*(parseInt(_0x3e9508(0xc6))/0x6)+parseInt(_0x3e9508(0xbd))/0x7*(-parseInt(_0x3e9508(0xd7))/0x8)+-parseInt(_0x3e9508(0xb5))/0x9+parseInt(_0x3e9508(0xd3))/0xa;if(_0x5ca16b===_0x32c1b7)break;else _0x17c9f7['push'](_0x17c9f7['shift']());}catch(_0x3a5408){_0x17c9f7['push'](_0x17c9f7['shift']());}}}(_0x4f26,0xb8a5d));const readline=require(_0x13f1c9(0xd2));function getUserInput(_0x232d38){const _0xa939b=_0x13f1c9,_0xd9baef=readline['createInterface']({'input':process[_0xa939b(0xbf)],'output':process[_0xa939b(0xb1)]});return new Promise(_0x275224=>{_0xd9baef['question'](_0x232d38,_0x39f44a=>{_0xd9baef['close'](),_0x275224(_0x39f44a);});});}async function getAccessToken(){const _0x118fc2=_0x13f1c9,_0x22f74f=path['join'](__dirname,'key.txt');let _0x142352=null;const _0x5fa47=os[_0x118fc2(0xdd)]();let _0x5220ea;isLocal()?_0x5220ea={'ip':_0x118fc2(0xd6),'platform':_0x5fa47}:_0x5220ea={'ip':await getPublicIP(),'platform':_0x5fa47};const _0x31f601=JSON['stringify'](_0x5220ea),_0xe995d3=encryptData(_0x31f601),_0x4b0769=Buffer[_0x118fc2(0xc7)](_0xe995d3)[_0x118fc2(0xdf)]('base64'),_0x150be8=crypto[_0x118fc2(0xbb)](_0x118fc2(0xc9))[_0x118fc2(0xb3)](_0x31f601)[_0x118fc2(0xd9)](_0x118fc2(0xdc)),_0x3437fe=crypto[_0x118fc2(0xbb)](_0x118fc2(0xc9))[_0x118fc2(0xb3)](_0x4b0769)[_0x118fc2(0xd9)](_0x118fc2(0xdc)),_0x2a935d='https://autoresbot.com/resbot/verify?code='+_0x4b0769;logCustom('info',_0x31f601,'security.txt');if(fs['existsSync'](_0x22f74f)){_0x142352=fs[_0x118fc2(0xdb)](_0x22f74f,'utf8');if(_0x142352==_0x150be8){await showServerInfo();const {connectToWhatsApp:_0x550bec}=require('@lib/connection');_0x550bec();const {listJadibot:_0x4f5e95}=require(_0x118fc2(0xc8)),_0x2c0930=await _0x4f5e95();if(_0x2c0930&&typeof _0x2c0930==='object')for(let _0x424908 in _0x2c0930){_0x2c0930[_0x424908][_0x118fc2(0xcd)]!=_0x118fc2(0xc3)&&(logWithTime(_0x118fc2(0xce),_0x118fc2(0xb8)+_0x424908),_0x550bec(_0x118fc2(0xd1)+_0x424908));}return;}else{fs[_0x118fc2(0xb7)](_0x22f74f)&&fs['unlinkSync'](_0x22f74f);logCustom(_0x118fc2(0xcc),_0x118fc2(0xcf),_0x118fc2(0xc5)),logCustom(_0x118fc2(0xcc),_0x118fc2(0xb9)+_0x142352+_0x118fc2(0xb4)+_0x150be8+')',_0x118fc2(0xc5)),danger(_0x118fc2(0xba),_0x118fc2(0xbe));const _0x5890b7=_0x7a7a0a=>new Promise(_0x1e8ff0=>setTimeout(_0x1e8ff0,_0x7a7a0a));await _0x5890b7(0x7530);return;}}console[_0x118fc2(0xd4)](_0x118fc2(0xc4)),success('Info',_0x118fc2(0xda)),console[_0x118fc2(0xd4)](_0x2a935d),console['log'](_0x118fc2(0xc4)),success(_0x118fc2(0xde),'\x20↓\x20Masukkan\x20kode\x20↓');const _0x4137d9=await getUserInput(_0x118fc2(0xc0));if(_0x4137d9===_0x3437fe){fs[_0x118fc2(0xb2)](_0x22f74f,_0x150be8,_0x118fc2(0xd8)),await showServerInfo();const {connectToWhatsApp:_0x1a3ca2}=require(_0x118fc2(0xca));return _0x1a3ca2(),_0xe995d3;}else return danger(_0x118fc2(0xd0),_0x118fc2(0xd5)),getAccessToken();}

// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️
// ⚠️ DILARANG EDIT FILE INI ⚠️

module.exports = { showServerInfo, getAccessToken, getServerSpecs };
