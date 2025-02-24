import { Client, IntentsBitField } from 'discord.js';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PORT = process.env.VITE_PORT || 3000;
const knownPlayers = new Set();
const serverChannels = new Map();

const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

const app = express();
app.use(express.json());
app.use(cors());

app.post('/alert', async (req, res) => {
    const { player } = req.body;
    if (!player) return res.status(400).send('Missing player name');

    serverChannels.forEach((channelId, serverId) => {
        bot.channels.fetch(channelId)
            .then((channel) => {
                if (channel) {
                    channel.send(`⚠️ Unknown player detected in render distance: **${player}**`);
                }
            })
            .catch((error) => {
                console.error(`Error sending message to server ${serverId}:`, error);
            });
    });

    res.send('OK');
});

bot.on('messageCreate', async (message) => {
    if (!message.content.startsWith('*')) return;
    const args = message.content.slice(1).split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'add' && args[0]) {
        knownPlayers.add(args[0]);
        message.channel.send(`✅ Player **${args[0]}** added to known list.`);
    }

    if (command === 'setchannel') {
        serverChannels.set(message.guild.id, message.channel.id);
        message.channel.send(`✅ This channel has been set for player alerts.`);
    }
});

bot.on('guildCreate', (guild) => {
    console.log(`Joined new server: ${guild.name} (${guild.id})`);
});

bot.once('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.login(TOKEN);
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
