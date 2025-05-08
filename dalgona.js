const { gameState } = require('../utils/gameState');

module.exports = {
    name: 'Dalgona/Honeycomb',
    rules: 'Type the shown pattern exactly as displayed. One mistake and you\'re eliminated! You have 30 seconds to complete your pattern.',
    
    patterns: [
        { shape: 'Triangle', sequence: '△' },
        { shape: 'Circle', sequence: '○' },
        { shape: 'Star', sequence: '★' },
        { shape: 'Umbrella', sequence: '☂' }
    ],
    
    async start(channel) {
        // Assign random patterns to players
        for (const [id, player] of gameState.players) {
            player.pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
            player.isAlive = true;
        }
        
        // Show assigned patterns
        const patternEmbed = {
            color: 0xFF0000,
            title: '🍯 Dalgona Challenge',
            description: 'Your assigned patterns:',
            fields: Array.from(gameState.players.entries()).map(([id, player]) => ({
                name: `<@${id}>`,
                value: `Your shape: ${player.pattern.shape} ${player.pattern.sequence}`
            }))
        };
        
        await channel.send({ embeds: [patternEmbed] });
        await channel.send('You have 30 seconds to type your pattern exactly! Start now!');
        
        const filter = m => gameState.players.has(m.author.id) && gameState.players.get(m.author.id).isAlive;
        const collector = channel.createMessageCollector({ filter, time: 30000 });
        
        collector.on('collect', message => {
            const player = gameState.players.get(message.author.id);
            if (player && player.isAlive) {
                if (message.content === player.pattern.sequence) {
                    player.score += 10;
                    player.completed = true;
                    channel.send(`✅ <@${message.author.id}> successfully traced their ${player.pattern.shape}!`);
                } else {
                    player.isAlive = false;
                    channel.send(`💥 <@${message.author.id}> broke their cookie and was eliminated!`);
                }
            }
        });
        
        collector.on('end', () => {
            // Eliminate players who didn't complete their pattern
            for (const [id, player] of gameState.players) {
                if (!player.completed && player.isAlive) {
                    player.isAlive = false;
                    channel.send(`⏰ <@${id}> ran out of time and was eliminated!`);
                }
            }
            
            this.endGame(channel);
        });
    },
    
    endGame(channel) {
        const survivors = Array.from(gameState.players.entries())
            .filter(([, player]) => player.isAlive)
            .sort(([, a], [, b]) => b.score - a.score);
            
        const resultsEmbed = {
            color: 0xFF0000,
            title: '🏆 Game Over!',
            description: survivors.length > 0 
                ? 'Players who successfully traced their patterns:'
                : 'No players survived!',
            fields: survivors.map(([id, player]) => ({
                name: `<@${id}>`,
                value: `Shape: ${player.pattern.shape} | Score: ${player.score}`
            }))
        };
        
        channel.send({ embeds: [resultsEmbed] });
        gameState.reset();
    }
};
