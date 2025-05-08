const { SlashCommandBuilder } = require('discord.js');
const { channelCheck } = require('../utils/channelCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),

    async execute(interaction) {
        // Check if bot has permission to interact in this channel
        if (!(await channelCheck.canInteract(interaction))) {
            return;
        }

        const helpEmbed = {
            color: 0xFF0000,
            title: '🦑 Squid Bot Commands',
            description: 'Welcome to Squid Game! Here are all available commands:',
            fields: [
                {
                    name: '/help',
                    value: 'Shows this help message'
                },
                {
                    name: '/play',
                    value: 'Start a new game session'
                },
                {
                    name: '/rules',
                    value: 'Shows the rules of the current game'
                }
            ],
            footer: {
                text: 'Good luck, and may the odds be in your favor!'
            }
        };

        await interaction.reply({ embeds: [helpEmbed] });
    }
};