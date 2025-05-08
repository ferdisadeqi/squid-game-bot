const { gameState } = require('../utils/gameState');

module.exports = {
    name: 'Red Light, Green Light',
    rules: 'When the bot says "Green Light", type "run" in the chat. When the bot says "Red Light", stop typing. If you type during red light, you\'re eliminated!',

    async start(channel) {
        console.log('Starting Red Light, Green Light game');
        const rounds = 5;
        let currentRound = 0;

        const playRound = async () => {
            if (currentRound >= rounds) {
                console.log('Game completed, all rounds finished');
                this.endGame(channel);
                return;
            }

            const isGreenLight = Math.random() > 0.5;
            const duration = Math.floor(Math.random() * 3000) + 2000;
            console.log(`Round ${currentRound + 1}: ${isGreenLight ? 'Green' : 'Red'} Light`);

            await channel.send(`🚦 ${isGreenLight ? 'Green Light!' : 'Red Light!'}`);

            if (isGreenLight) {
                const filter = m => m.content.toLowerCase() === 'run' && gameState.players.has(m.author.id);
                const collector = channel.createMessageCollector({ filter, time: duration });

                collector.on('collect', message => {
                    const player = gameState.players.get(message.author.id);
                    if (player && player.isAlive) {
                        player.score += 1;
                        console.log(`Player ${message.author.tag} scored a point`);
                    }
                });
            } else {
                const filter = m => gameState.players.has(m.author.id);
                const collector = channel.createMessageCollector({ filter, time: duration });

                collector.on('collect', message => {
                    const player = gameState.players.get(message.author.id);
                    if (player && player.isAlive) {
                        player.isAlive = false;
                        console.log(`Player ${message.author.tag} eliminated for moving on red light`);
                        channel.send(`☠️ ${message.author} has been eliminated!`);
                    }
                });
            }

            currentRound++;
            setTimeout(() => playRound(), duration + 1000);
        };

        await channel.send('🎮 Red Light, Green Light is starting!');
        console.log('Game initialized with players:', Array.from(gameState.players.keys()).length);
        playRound();
    },

    endGame(channel) {
        const survivors = Array.from(gameState.players.entries())
            .filter(([, player]) => player.isAlive)
            .sort(([, a], [, b]) => b.score - a.score);

        console.log('Game ended with survivors:', survivors.length);

        const resultsEmbed = {
            color: 0xFF0000,
            title: '🏆 Game Over!',
            description: survivors.length > 0 
                ? 'Surviving players and their scores:'
                : 'No players survived!',
            fields: survivors.map(([id, player]) => ({
                name: `<@${id}>`,
                value: `Score: ${player.score}`
            }))
        };

        channel.send({ embeds: [resultsEmbed] });
        gameState.reset();
    }
};