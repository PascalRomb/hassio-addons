const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, { polling: true });
const ngrok = require('ngrok');
const { exit } = require('process');

// replace the value below with the Telegram token you receive from @BotFather
var TOKEN = "";
//see README.md for further information
var ACCESS_MAP = new Map();


try {
    console.log("setting up..");
    const data = fs.readFileSync('/data/option.json', 'utf8');

    const options = JSON.parse(data);
    TOKEN = options.token;
    console.log("Token", TOKEN);
    console.log("Allowed_users", options.allow_users);
    for (let index in options.allow_users) {
        let user = options.allow_users[index];
        let id = user.id;
        let password = user.password;
        let logged = user.logged;
        ACCESS_MAP.set(id, { password: password, logged: logged });
    }

} catch (err) {
    console.log(`Error reading file from disk: ${err}`);
    process.exit(1);
}


var tunnel_list = new Map();


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;

    message = "Hello " + msg.chat.first_name + "! Your id is:" + chatId;
    message += "Please log with /pwd <password>";

    bot.sendMessage(chatId, message);
});


bot.onText(/\/pwd (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;

    let message = "";
    const requestedPassword = match[1];
    if (requestedPassword === ACCESS_MAP.get(chatId).password) {
        ACCESS_MAP.get(chatId).logged = true;
        message = "Authentication Success!";
    } else {
        message = "Authentication Failed!";
    }
    bot.sendMessage(chatId, message);
});

bot.onText(/\/exit/, (msg) => {
    const chatId = msg.chat.id;
    if (!checkPermission(chatId)) return;

    ACCESS_MAP.get(chatId).logged = false;
    bot.sendMessage(chatId, "Exit, see you soon " + msg.chat.first_name);
});

// /tunnel port. port can be 2 or 4 digit.
bot.onText(/\/tunnel (?<!\d)(\d{2}|\d{4})(?!\d)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!checkPermission(chatId)) return;

    const port = match[1];

    (async function () {
        if (tunnel_list.keys.length === 1) {
            bot.sendMessage(chatId, "One tunnel already exists. Type /tunnels to show more");
        }
        const url = await ngrok.connect(port);
        tunnel_list.set(url, port);
        bot.sendMessage(chatId, "Tunnelling started on port: " + port);
        bot.sendMessage(chatId, "url: " + url);
    })().catch((reason) => {
        bot.sendMessage(chatId, reason.msg + " :\n" + reason.details.err);
    });

});


bot.onText(/\/kill/, (msg) => {
    const chatId = msg.chat.id;
    if (!checkPermission(chatId)) return;
    ngrok.kill()
    bot.sendMessage(chatId, "Kill ngrok process successful!")
});

bot.onText(/\/tunnels/, (msg) => {
    const chatId = msg.chat.id;
    if (!checkPermission(chatId)) return;

    let message = "Tunnels: \n";
    for ([key, value] of tunnel_list.entries()) {
        message += key + " on port: " + value + "\n";
    }

    bot.sendMessage(chatId, message);
});

function checkPermission(chatId) {
    if (!isAdmin(chatId)) return false;

    if (!ACCESS_MAP.get(chatId).logged) {
        bot.sendMessage(chatId, "You are not logged, please type /pwd <password>");
        return false;
    }

    return true;
}


function isAdmin(chatId) {
    if (!ACCESS_MAP.has(chatId)) {
        bot.sendMessage(chatId, "You are not admin");
        return false;
    }
    return true;
}