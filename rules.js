const { SlashCommandBuilder } = require('discord.js');
const { gameState } = require('../utils/gameState');
const { channelCheck } = require('../utils/channelCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Shows the rules of the current game'),

    async execute(interaction) {
        // Check if bot has permission to interact in this channel
        if (!(await channelCheck.canInteract(interaction))) {
            return;
        }

        if (!gameState.currentGame) {
            return interaction.reply({
                content: 'No game is currently active. Use /play to start a new game!',
                ephemeral: true
            });
        }

        const rulesEmbed = {
            color: 0xFF0000,
            title: `📜 Rules: ${gameState.currentGame.name}`,
            description: gameState.currentGame.rules,
            footer: {
                text: 'Good luck, players!'
            }
        };

        await interaction.reply({ embeds: [rulesEmbed] });
    }
};