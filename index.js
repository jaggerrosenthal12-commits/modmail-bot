require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Function to send ticket button
async function sendTicketMessage(channelId) {
    const channel = await client.channels.fetch(channelId);
    const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription('Click the button below to create a ticket!')
        .setColor(0x00AE86);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('createTicket')
                .setLabel('Create Ticket')
                .setStyle(ButtonStyle.Primary)
        );

    await channel.send({ embeds: [embed], components: [row] });
}

// Bot ready
client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    const ticketChannelId = process.env.TICKET_CHANNEL_ID;
    await sendTicketMessage(ticketChannelId);
});

// Button interaction handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;

    // ===== CREATE TICKET =====
    if (interaction.customId === 'createTicket') {
        try {
            await interaction.deferReply({ ephemeral: true });

            const categoryId = process.env.CATEGORY_ID;

            // Create a channel named after user
            const ticketChannel = await guild.channels.create({
                name: interaction.member.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                type: 0,
                parent: categoryId,
                permissionOverwrites: [
                    { id: guild.roles.everyone, deny: ['ViewChannel'] },
                    { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
                ],
            });

            // Add Close Ticket button
            const closeRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('closeTicket')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

            await ticketChannel.send({
                content: `Welcome ${interaction.user}, a staff member will assist you shortly!`,
                components: [closeRow]
            });

            await interaction.editReply({ content: `✅ Your ticket has been created: ${ticketChannel}` });
        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true });
            }
        }
    }

    // ===== CLOSE TICKET =====
    else if (interaction.customId === 'closeTicket') {
        try {
            // Always reply to acknowledge interaction first
            await interaction.reply({ content: `🗑️ Ticket ${interaction.channel.name} will be closed.`, ephemeral: true });

            // Delete the channel
            await interaction.channel.delete();
        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Failed to close ticket.', ephemeral: true });
            }
        }
    }
});

// Login
client.login(process.env.TOKEN);
