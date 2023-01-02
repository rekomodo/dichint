const { Collection } = require('discord.js');
const { token } = require('./config.json');
require('dotenv').config();

const client = require('./discordClient.js');
const tmiClient = require('./tmiClient');

//GUILD DATA SETUP

const guildData = new Collection();
guildData.set('tmiClient', tmiClient);
guildData.set('channelMessages', new Collection());

//MAKE PER-GUILD COLLECTION
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const guildIds = client.guilds.cache.keys();
    for (const id of guildIds) {
        guildData.set(id, new Collection());
    }
});

//TWITCH CLIENT SETUP

tmiClient.on('message', (twitchChannel, tags, message, self) => {
    // Lack of this statement or its inverse (!self) will make it inactive
    if (self) return;
    
    const subscribedChannels = guildData.get(twitchChannel);

    const discordMessage = `${twitchChannel} ... **${tags['display-name']}**: ${message}`;
    for (const channelId of subscribedChannels) {
        guildData.get('channelMessages').get(channelId).push(discordMessage);
    }
});

//MESSAGE PUSH LOOP

setInterval(() => {
    guildData.get('channelMessages').forEach((msgBacklog, channelId) => {
        client.channels.fetch(channelId).then(channel => {
            //console.log(`${msgBacklog.length} Messages to ${channelId}`);

            msgContent = "";
            while(msgBacklog.length > 0 && msgContent.length + msgBacklog.at(-1).length <= 2000)
                msgContent += `${msgBacklog.pop()}\n`;
            msgBacklog = [];

            if(msgContent.length > 2000)
                channel.send('Sorry, too many characters...');
            else if(msgContent.length > 0)
                channel.send(msgContent);
        }).catch(err => {
            console.log(err);
        });
    });
}, 1000);

//INTERACTION HANDLING

client.on('interactionCreate', async interaction => {
    if(!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if(!command) return;
    
    await interaction.deferReply();
    try {
        await command.execute(client, interaction, guildData);
    } catch (error) {
        console.error(error);
        await interaction.followUp({
            content: 'There was an error while executing this command',
            ephemeral: true
        });
    }
});

client.login(token);