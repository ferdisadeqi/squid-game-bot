const { SlashCommandBuilder } = require('discord.js');
const { channelCheck } = require('../utils/channelCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Send an announcement to all servers (Bot Owner Only)')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message to send')
                .setRequired(true)),

    async execute(interaction) {
        // Check if bot has permission to interact in this channel
        if (!(await channelCheck.canInteract(interaction))) {
            return;
        }

        // Check if the user is the bot owner
        const application = await interaction.client.application.fetch();
        console.log('Debug - User attempting announcement:', {
            userId: interaction.user.id,
            userTag: interaction.user.tag
        });

        if (interaction.user.id !== application.owner.id) {
            return interaction.reply({
                content: '❌ Only the bot owner can use this command!',
                ephemeral: true
            });
        }

        const message = interaction.options.getString('message');

        // Fetch all guilds and send the announcement
        const announcementEmbed = {
            color: 0xFF0000,
            title: '📢 Squid Bot Announcement',
            description: message,
            timestamp: new Date(),
            footer: {
                text: `Announcement from ${interaction.user.tag}`
            }
        };

        let successCount = 0;
        let failCount = 0;

        // Send to all guilds
        for (const guild of interaction.client.guilds.cache.values()) {
            try {
                // Try to send to the first available text channel
                const channel = guild.channels.cache
                    .find(channel => channel.type === 0 && // 0 is GUILD_TEXT
                        channel.permissionsFor(guild.members.me).has('SendMessages'));

                if (channel) {
                    await channel.send({ embeds: [announcementEmbed] });
                    console.log(`Debug - Announcement sent successfully to guild: ${guild.name}`);
                    successCount++;
                } else {
                    console.log(`Debug - No suitable channel found in guild: ${guild.name}`);
                    failCount++;
                }
            } catch (error) {
                console.error(`Failed to send announcement to guild ${guild.name}:`, error);
                failCount++;
            }
        }

        // Reply to the command user with results
        await interaction.reply({
            content: `✅ Announcement sent!\nSuccess: ${successCount} servers\nFailed: ${failCount} servers`,
            ephemeral: true
        });
    }
};