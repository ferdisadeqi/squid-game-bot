const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');
const help = require('./commands/help');
const play = require('./commands/play');
const rules = require('./commands/rules');
const announcement = require('./commands/announcement');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

// Register all commands
const commands = [help, play, rules, announcement];
commands.forEach(command => {
    client.commands.set(command.data.name, command);
});

// Enhanced reconnection and error handling
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 5000; // 5 seconds

function handleReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

        setTimeout(() => {
            client.login(process.env.NEW_DISCORD_TOKEN)
                .then(() => {
                    console.log('Successfully reconnected to Discord!');
                    reconnectAttempts = 0;
                })
                .catch(error => {
                    console.error('Reconnection attempt failed:', error);
                    handleReconnect();
                });
        }, reconnectDelay * Math.min(reconnectAttempts, 5)); // Exponential backoff up to 25 seconds
    } else {
        console.error('Maximum reconnection attempts reached. Please check your connection and restart the bot.');
        process.exit(1); // Exit so Replit can restart the process
    }
}

// Event handlers for connection management
client.on('disconnect', () => {
    console.error('Bot disconnected from Discord! Attempting to reconnect...');
    handleReconnect();
});

client.on('error', error => {
    console.error('Discord client error:', error);
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        handleReconnect();
    }
});

client.on('debug', info => {
    // Log important debug information
    if (info.includes('Heartbeat') || info.includes('Session') || info.includes('Gateway')) {
        console.log('Debug:', info);
    }
});

// Heartbeat monitoring
setInterval(() => {
    if (!client.ws.shards.size) {
        console.log('No active shards detected. Attempting to reconnect...');
        handleReconnect();
    } else {
        client.ws.shards.forEach(shard => {
            if (shard.ping > 10000) { // If ping is higher than 10 seconds
                console.log(`High latency detected on shard ${shard.id}. Attempting to reconnect...`);
                handleReconnect();
            }
        });
    }
}, 30000); // Check every 30 seconds

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('Squid Game | /help', { type: 'Playing' });

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.NEW_DISCORD_TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(command => command.data.toJSON()) }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution error:', error);
        const errorMessage = error.message || 'An unknown error occurred';
        await interaction.reply({ 
            content: `There was an error executing this command: ${errorMessage}`,
            ephemeral: true 
        }).catch(console.error);
    }
});

// Make sure we're using the environment variable
if (!process.env.NEW_DISCORD_TOKEN) {
    console.error('Discord token not found! Please make sure NEW_DISCORD_TOKEN is set in the environment.');
    process.exit(1);
}

// Initial connection with error handling
console.log('Attempting to connect to Discord...');
client.login(process.env.NEW_DISCORD_TOKEN).catch(error => {
    console.error('Failed to connect to Discord:', error);
    handleReconnect();
});