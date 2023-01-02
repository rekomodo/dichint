const tmi = require('tmi.js');
const { twitch_oauth, twitch_username } = require('./config.json');

const client = new tmi.Client({
    options: {debug: false, messagesLogLevel: "warn"},
    connection: {
        reconnect: true,
        secure: true
    },
    identity:{
        username: twitch_username,
        password: twitch_oauth
    },

    channels: []
});

client.connect().catch(console.error);

module.exports = client;