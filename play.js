const { SlashCommandBuilder } = require('discord.js');
const { gameState } = require('../utils/gameState');
const { channelCheck } = require('../utils/channelCheck');
const redLightGreenLight = require('../games/redLightGreenLight');
const glassBridge = require('../games/glassBridge');
const tugOfWar = require('../games/tugOfWar');
const dalgona = require('../games/dalgona');
const marbles = require('../games/marbles');
const mingle = require('../games/mingle');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Start a new game')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Choose which game to play')
                .setRequired(true)
                .addChoices(
                    { name: 'Red Light, Green Light', value: 'redlight' },
                    { name: 'Glass Bridge', value: 'bridge' },
                    { name: 'Tug of War', value: 'tugofwar' },
                    { name: 'Dalgona/Honeycomb', value: 'dalgona' },
                    { name: 'Marbles', value: 'marbles' },
                    { name: 'Mingle', value: 'mingle' }
                )),

    async execute(interaction) {
        // Log command usage
        console.log('Play command used:', {
            user: interaction.user.tag,
            channel: interaction.channel.name,
            guild: interaction.guild.name
        });

        // Check if bot has permission to interact in this channel
        if (!(await channelCheck.canInteract(interaction))) {
            return;
        }

        if (gameState.isGameActive) {
            return interaction.reply({
                content: 'A game is already in progress!',
                ephemeral: true
            });
        }

        const gameChoice = interaction.options.getString('game');
        console.log('Game selected:', gameChoice);

        let selectedGame;

        switch (gameChoice) {
            case 'redlight':
                selectedGame = redLightGreenLight;
                break;
            case 'bridge':
                selectedGame = glassBridge;
                break;
            case 'tugofwar':
                selectedGame = tugOfWar;
                break;
            case 'dalgona':
                selectedGame = dalgona;
                break;
            case 'marbles':
                selectedGame = marbles;
                break;
            case 'mingle':
                selectedGame = mingle;
                break;
        }

        gameState.currentGame = selectedGame;
        gameState.isGameActive = true;
        gameState.players = new Map();
        gameState.players.set(interaction.user.id, { 
            id: interaction.user.id,
            score: 0, 
            isAlive: true 
        });

        const gameEmbed = {
            color: 0xFF0000,
            title: `🎮 ${selectedGame.name} is Starting!`,
            description: `${selectedGame.rules}\n\nWaiting for players... React with 🎮 to join!`,
            footer: {
                text: 'Game will start in 30 seconds'
            }
        };

        const gameMessage = await interaction.reply({ embeds: [gameEmbed], fetchReply: true });
        await gameMessage.react('🎮');

        setTimeout(async () => {
            const reactions = await gameMessage.reactions.cache.get('🎮').users.fetch();
            console.log('Players joined:', reactions.size - 1); // -1 for bot's reaction

            reactions.forEach(user => {
                if (!user.bot) {
                    gameState.players.set(user.id, { 
                        id: user.id,
                        score: 0, 
                        isAlive: true 
                    });
                }
            });

            selectedGame.start(interaction.channel);
        }, 30000);
    }
};