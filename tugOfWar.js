const { gameState } = require('../utils/gameState');

module.exports = {
    name: 'Tug of War',
    rules: 'Two teams compete by typing "PULL" as fast as possible. The team with the most pulls in 30 seconds wins! If you miss-type, you lose a pull.',
    
    async start(channel) {
        const gameDuration = 30000; // 30 seconds
        const players = Array.from(gameState.players.values());
        
        // Split players into two teams randomly
        players.sort(() => Math.random() - 0.5);
        const midPoint = Math.ceil(players.length / 2);
        const team1 = players.slice(0, midPoint);
        const team2 = players.slice(midPoint);
        
        const team1Score = { count: 0 };
        const team2Score = { count: 0 };
        
        // Store team assignments
        team1.forEach(player => player.team = 1);
        team2.forEach(player => player.team = 2);
        
        // Send team assignments
        const teamEmbed = {
            color: 0xFF0000,
            title: '🏋️ Tug of War Teams',
            fields: [
                {
                    name: 'Team 1 🔴',
                    value: team1.map(p => `<@${p.id}>`).join('\n') || 'No players'
                },
                {
                    name: 'Team 2 🔵',
                    value: team2.map(p => `<@${p.id}>`).join('\n') || 'No players'
                }
            ]
        };
        
        await channel.send({ embeds: [teamEmbed] });
        await channel.send('Game starts in 3...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await channel.send('2...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await channel.send('1...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await channel.send('🏋️ PULL!');
        
        const filter = m => 
            gameState.players.has(m.author.id) && 
            m.content.toUpperCase() === 'PULL';
            
        const collector = channel.createMessageCollector({ filter, time: gameDuration });
        
        collector.on('collect', message => {
            const player = gameState.players.get(message.author.id);
            if (player.team === 1) {
                team1Score.count++;
                player.score++;
            } else {
                team2Score.count++;
                player.score++;
            }
        });
        
        collector.on('end', () => {
            const winner = team1Score.count > team2Score.count ? 1 : 
                         team2Score.count > team1Score.count ? 2 : 0;
                         
            const resultsEmbed = {
                color: 0xFF0000,
                title: '🏆 Tug of War Results',
                fields: [
                    {
                        name: 'Team 1 🔴',
                        value: `Pulls: ${team1Score.count}`
                    },
                    {
                        name: 'Team 2 🔵',
                        value: `Pulls: ${team2Score.count}`
                    },
                    {
                        name: 'Winner',
                        value: winner === 0 ? "It's a tie!" : `Team ${winner} wins!`
                    }
                ]
            };
            
            channel.send({ embeds: [resultsEmbed] });
            this.endGame(channel);
        });
    },
    
    endGame(channel) {
        const survivors = Array.from(gameState.players.entries())
            .sort(([, a], [, b]) => b.score - a.score);
            
        const resultsEmbed = {
            color: 0xFF0000,
            title: '🏆 Game Over!',
            description: 'Player scores:',
            fields: survivors.map(([id, player]) => ({
                name: `<@${id}>`,
                value: `Score: ${player.score}`
            }))
        };
        
        channel.send({ embeds: [resultsEmbed] });
        gameState.reset();
    }
};
