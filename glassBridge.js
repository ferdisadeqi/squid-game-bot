const { gameState } = require('../utils/gameState');

module.exports = {
    name: 'Glass Bridge',
    rules: 'Choose either the left (⬅️) or right (➡️) glass panel. One is tempered and will hold, the other will break. Make it across 5 panels to win!',
    
    async start(channel) {
        const bridge = Array(5).fill(null).map(() => Math.random() < 0.5);
        let currentStep = 0;

        const sendBridgeState = async () => {
            const bridgeEmbed = {
                color: 0xFF0000,
                title: '🌉 Glass Bridge',
                description: 'Choose your path: Left (⬅️) or Right (➡️)',
                fields: [
                    {
                        name: 'Progress',
                        value: `${currentStep}/5 steps crossed`
                    }
                ]
            };

            const message = await channel.send({ embeds: [bridgeEmbed] });
            await message.react('⬅️');
            await message.react('➡️');

            const filter = (reaction, user) => 
                ['⬅️', '➡️'].includes(reaction.emoji.name) && 
                gameState.players.has(user.id) &&
                gameState.players.get(user.id).isAlive;

            const collector = message.createReactionCollector({ filter, time: 30000 });

            collector.on('collect', async (reaction, user) => {
                const isLeftChoice = reaction.emoji.name === '⬅️';
                const player = gameState.players.get(user.id);

                if (player && player.isAlive) {
                    if ((isLeftChoice && bridge[currentStep]) || (!isLeftChoice && !bridge[currentStep])) {
                        player.score += 1;
                        await channel.send(`✅ ${user} chose correctly and survived!`);
                    } else {
                        player.isAlive = false;
                        await channel.send(`💥 ${user} chose poorly and fell!`);
                    }

                    if (currentStep < 4) {
                        currentStep++;
                        collector.stop();
                        sendBridgeState();
                    } else {
                        this.endGame(channel);
                    }
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    this.endGame(channel);
                }
            });
        };

        await channel.send('🎮 Glass Bridge challenge is starting!');
        sendBridgeState();
    },

    endGame(channel) {
        const survivors = Array.from(gameState.players.entries())
            .filter(([, player]) => player.isAlive)
            .sort(([, a], [, b]) => b.score - a.score);

        const resultsEmbed = {
            color: 0xFF0000,
            title: '🏆 Game Over!',
            description: survivors.length > 0 
                ? 'Players who made it across:'
                : 'No players made it across!',
            fields: survivors.map(([id, player]) => ({
                name: `<@${id}>`,
                value: `Score: ${player.score}`
            }))
        };

        channel.send({ embeds: [resultsEmbed] });
        gameState.reset();
    }
};
