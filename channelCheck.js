const channelCheck = {
    // Check if the bot has permission to interact in this channel
    async canInteract(interaction) {
        const channel = interaction.channel;
        const permissions = channel.permissionsFor(interaction.guild.members.me);

        // Log permission check
        console.log('Permission check for channel:', {
            channelName: channel.name,
            channelId: channel.id,
            permissions: {
                viewChannel: permissions.has('ViewChannel'),
                sendMessages: permissions.has('SendMessages'),
                readMessageHistory: permissions.has('ReadMessageHistory'),
                addReactions: permissions.has('AddReactions'),
                manageMessages: permissions.has('ManageMessages'),
                embedLinks: permissions.has('EmbedLinks')
            }
        });

        // Check if bot has basic permissions needed
        const hasPermissions = permissions.has([
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'AddReactions',
            'ManageMessages',
            'EmbedLinks'
        ]);

        if (!hasPermissions) {
            await interaction.reply({
                content: '❌ I don\'t have permission to interact in this channel.\n\nServer admins: To restrict me to specific channels:\n1. Server Settings > Roles > Find my role\n2. Under "General Permissions", turn OFF "View Channels"\n3. Right-click the desired channel > Edit Channel > Permissions\n4. Click the + under "Role Permissions" and add my role\n5. Enable these permissions only for that channel:\n   • View Channel\n   • Send Messages\n   • Read Message History\n   • Add Reactions\n   • Manage Messages\n   • Embed Links',
                ephemeral: true
            });
            return false;
        }

        return true;
    }
};

module.exports = { channelCheck };