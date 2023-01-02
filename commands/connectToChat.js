const twitch = require('twitch-m3u8');
const voice = require('@discordjs/voice');
const { SlashCommandBuilder } = require('discord.js');
const getTwitchName = require('./../getTwitchName.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Starts the chat connection between this channel and the inputted twitch channel')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Twitch channel name')
                .setRequired(true)
        ),
    async execute(client, interaction, guildData){
        let twitchChannel = interaction.options.getString('channel');
        const guildId = interaction.guild.id;
        const voiceChannelId = interaction.member.voice.channelId;

        //CHECK IF TWITCH CHANNEL EXISTS AND IS STREAMING

        twitchChannel = await getTwitchName(twitchChannel);
        if(twitchChannel == undefined){
            twitchChannel = interaction.options.getString('channel');
            await interaction.followUp(`Failed to fetch ${twitchChannel} (typo?)`);
            return;
        }

        //SET UP GUILD DATA

        if(guildData.get(twitchChannel) == undefined)
            guildData.set(twitchChannel, new Set());
        guildData.get(twitchChannel).add(interaction.channelId);

        guildData.get('channelMessages').set(interaction.channelId, []);

        guildData.get(guildId).set('playing', twitchChannel);

        //GET TWITCH CHAT WITH TMI.JS AND AUDIO WITH TWITCH-M3U8

        const tmiClient = guildData.get('tmiClient');
        await tmiClient.join(twitchChannel)
        .then(data => {
            twitchChannel = data[0];
        }).catch(err => {
            console.log(err);
            interaction.followUp('An error has occurred while joining chat.');
        });

        //sanitize user input later
        const streamLink = await twitch.getStream(twitchChannel.substring(1))
        .then(data => {
            return data.at(-1).url;
        })
        .catch(err => {
            return interaction.followUp('Error getting stream link (offline?)');
        });

        //VOICE CHANNEL

        //CHECK IF USER IS IN VOICE CHANNEL
        if(voiceChannelId == null)
            return await interaction.followUp('Not in a voice channel');
            
        //JOIN VOICE CHANNEL
        let voiceChannelConnection = voice.joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        //CREATE AND SUBSCRIBE TO AUDIO PLAYER, THEN PLAY STREAM AUDIO

        let player = voice.createAudioPlayer();
        voiceChannelConnection.subscribe(player);

        let resource = voice.createAudioResource(streamLink);
        player.play(resource);

        await interaction.followUp(`Connected to ${twitchChannel}`);
    }
};