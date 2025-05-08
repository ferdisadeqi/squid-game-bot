const { gameState } = require('../utils/gameState');

module.exports = {
    name: 'Mingle',
    rules: 'Interact with other players by typing "hello @player". The player who interacts with the most unique players in 60 seconds wins!',
    
    async start(channel) {
        const gameDuration = 60000; // 60 seconds
        const interactions = new Map(); // Track player interactions
        
        // Initialize interaction tracking for each player
        for (const [playerId] of gameState.players) {
            interactions.set(playerId, new Set());
        }
        
        await channel.send('🎮 Mingle game is starting!');
        await channel.send('You have 60 seconds to interact with as many players as possible!\nType "hello @player" to interact!');
        
        const filter = m => gameState.players.has(m.author.id) && 
                          m.content.toLowerCase().startsWith('hello') && 
                          m.mentions.users.size > 0;
                          
        const collector = channel.createMessageCollector({ filter, time: gameDuration });
        
        collector.on('collect', message => {
            const player = gameState.players.get(message.author.id);
            const mentionedPlayers = message.mentions.users;
            
            mentionedPlayers.forEach(mentionedUser => {
                if (gameState.players.has(mentionedUser.id) && mentionedUser.id !== message.author.id) {
                    // Add interaction to player's set
                    interactions.get(message.author.id).add(mentionedUser.id);
                    player.score = interactions.get(message.author.id).size;
                    
                    // Send feedback
                    channel.send(`✨ ${message.author} interacted with ${mentionedUser}! Current score: ${player.score}`);
                }
            });
        });
        
        collector.on('end', () => {
            this.endGame(channel, interactions);
        });
    },
    
    endGame(channel, interactions) {
        // Calculate final scores
        for (const [playerId, interactionSet] of interactions) {
            const player = gameState.players.get(playerId);
            player.score = interactionSet.size;
        }
        
        const results = Array.from(gameState.players.entries())
            .sort(([, a], [, b]) => b.score - a.score);
            
        const resultsEmbed = {
            color: 0xFF0000,
            title: '🏆 Mingle Game Results',
            description: 'Final Interaction Scores:',
            fields: results.map(([id, player]) => ({
                name: `<@${id}>`,
                value: `Interacted with ${player.score} players`
            }))
        };
        
        channel.send({ embeds: [resultsEmbed] });
        gameState.reset();
    }
};
