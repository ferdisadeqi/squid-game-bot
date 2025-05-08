const { gameState } = require('../utils/gameState');

module.exports = {
    name: 'Marbles',
    rules: 'Players compete in pairs. Guess if your opponent has an odd or even number of marbles (1-10). Guess correctly to win their marbles!',
    
    async start(channel) {
        const players = Array.from(gameState.players.values());
        
        // Need at least 2 players
        if (players.length < 2) {
            await channel.send('❌ Need at least 2 players for Marbles!');
            return this.endGame(channel);
        }
        
        // Randomly pair players
        players.sort(() => Math.random() - 0.5);
        const pairs = [];
        for (let i = 0; i < players.length - 1; i += 2) {
            pairs.push([players[i], players[i + 1]]);
        }
        
        // If odd number of players, last one automatically survives
        const unpaired = players.length % 2 === 1 ? players[players.length - 1] : null;
        if (unpaired) {
            unpaired.score += 5;
            await channel.send(`<@${unpaired.id}> had no partner and automatically advances!`);
        }
        
        // Send pair assignments
        const pairsEmbed = {
            color: 0xFF0000,
            title: '🔮 Marbles Game Pairs',
            description: 'Players have been paired! Each round has two phases:\n1. Choose your marbles (1-10)\n2. Guess if your opponent\'s number is odd or even',
            fields: pairs.map((pair, index) => ({
                name: `Pair ${index + 1}`,
                value: `<@${pair[0].id}> vs <@${pair[1].id}>`
            }))
        };
        
        await channel.send({ embeds: [pairsEmbed] });
        
        // Process each pair
        for (const [player1, player2] of pairs) {
            await channel.send(`\n🎯 Round starting for <@${player1.id}> vs <@${player2.id}>`);
            
            // Phase 1: Choose marbles
            await channel.send('DM me your number of marbles (1-10)');
            
            const marbleChoices = new Map();
            const filter = m => 
                (m.author.id === player1.id || m.author.id === player2.id) &&
                !isNaN(m.content) &&
                parseInt(m.content) >= 1 &&
                parseInt(m.content) <= 10;
                
            const collector = channel.createMessageCollector({ filter, time: 30000 });
            
            collector.on('collect', message => {
                if (!marbleChoices.has(message.author.id)) {
                    marbleChoices.set(message.author.id, parseInt(message.content));
                    message.reply('✅ Number received!');
                }
                
                if (marbleChoices.size === 2) {
                    collector.stop();
                }
            });
            
            await new Promise(resolve => {
                collector.on('end', resolve);
            });
            
            // If someone didn't choose, they're eliminated
            if (!marbleChoices.has(player1.id)) {
                player1.isAlive = false;
                player2.score += 10;
                await channel.send(`<@${player1.id}> didn't choose in time and was eliminated!`);
                continue;
            }
            if (!marbleChoices.has(player2.id)) {
                player2.isAlive = false;
                player1.score += 10;
                await channel.send(`<@${player2.id}> didn't choose in time and was eliminated!`);
                continue;
            }
            
            // Phase 2: Guess odd/even
            await channel.send('Now guess if your opponent\'s number is "odd" or "even"');
            
            const guesses = new Map();
            const guessFilter = m => 
                (m.author.id === player1.id || m.author.id === player2.id) &&
                ['odd', 'even'].includes(m.content.toLowerCase());
                
            const guessCollector = channel.createMessageCollector({ filter: guessFilter, time: 30000 });
            
            guessCollector.on('collect', message => {
                if (!guesses.has(message.author.id)) {
                    guesses.set(message.author.id, message.content.toLowerCase());
                    message.reply('✅ Guess received!');
                }
                
                if (guesses.size === 2) {
                    guessCollector.stop();
                }
            });
            
            await new Promise(resolve => {
                guessCollector.on('end', resolve);
            });
            
            // Process results
            const p1Marbles = marbleChoices.get(player1.id);
            const p2Marbles = marbleChoices.get(player2.id);
            const p1Guess = guesses.get(player1.id);
            const p2Guess = guesses.get(player2.id);
            
            const p1Correct = p1Guess === (p2Marbles % 2 === 0 ? 'even' : 'odd');
            const p2Correct = p2Guess === (p1Marbles % 2 === 0 ? 'even' : 'odd');
            
            if (p1Correct && !p2Correct) {
                player2.isAlive = false;
                player1.score += 10;
                await channel.send(`<@${player1.id}> wins! They correctly guessed ${p1Guess}!`);
            } else if (p2Correct && !p1Correct) {
                player1.isAlive = false;
                player2.score += 10;
                await channel.send(`<@${player2.id}> wins! They correctly guessed ${p2Guess}!`);
            } else if (p1Correct && p2Correct) {
                await channel.send("It's a tie! Both players survive!");
                player1.score += 5;
                player2.score += 5;
            } else {
                await channel.send("Neither player guessed correctly! Both are eliminated!");
                player1.isAlive = false;
                player2.isAlive = false;
            }
        }
        
        this.endGame(channel);
    },
    
    endGame(channel) {
        const survivors = Array.from(gameState.players.entries())
            .filter(([, player]) => player.isAlive)
            .sort(([, a], [, b]) => b.score - a.score);
            
        const resultsEmbed = {
            color: 0xFF0000,
            title: '🏆 Game Over!',
            description: survivors.length > 0 
                ? 'Surviving players:'
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
