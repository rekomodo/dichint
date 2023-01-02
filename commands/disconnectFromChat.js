const { SlashCommandBuilder } = require('discord.js');
const getTwitchName = require('./../getTwitchName.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Stops the chat connection between this channel and the inputted twitch channel')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Twitch channel name')
                .setRequired(true)
        ),
    async execute(client, interaction, guildData){
        let twitchChannel = interaction.options.getString('channel');
        const guildId = interaction.guild.id;

        //CHECK IF TWITCH CHANNEL EXISTS AND IS STREAMING

        twitchChannel = await getTwitchName(twitchChannel);
        if(twitchChannel == undefined){
            await interaction.followUp(`Failed to fetch ${twitchChannel} (typo?)`);
            return;
        }

        //SET UP GUILD DATA

        if(guildData.get(twitchChannel) == undefined)
            guildData.set(twitchChannel, new Set());

        const removed = guildData.get(twitchChannel).delete(interaction.channelId);

        if(removed)
            interaction.followUp(`Succesfully disconnected from ${twitchChannel}'s chat`);
        else
            interaction.followUp(`Could not disconnect from ${twitchChannel}'s chat`);

        //STOP VC

        const voiceChannelConnection = await client.voice.adapters.get(guildId);
        if(voiceChannelConnection != undefined){
            voiceChannelConnection.destroy();
            return await interaction.followUp('Ive been shushed');
        } else {
            return await interaction.followUp("No shushing");
        }
    }
};