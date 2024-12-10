import { GuildBasedChannel, TextChannel, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Prisma } from '@prisma/client';

import { command as prompt } from './prompt.ts';
import prisma from '../../prisma/db.ts';

let initServer: Prisma.ServerCreateInput | object = {};
let initConfig: Prisma.ServerUpdateInput | object = {};

interface Config {
	promptChannelId: string;
}

let targetChannel: Config | GuildBasedChannel | null = null;

export const command = {
	data: new SlashCommandBuilder()
	.setName('setpromptchannel')
	.setDescription('selects a channel to post prompts daily')
	.addChannelOption(option => option .setName('channel')
	.setDescription('channel to post weekly mutations')
	.setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addBooleanOption(opt => opt.setName('terminate').setDescription('Cancel existing mutation prompter'))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		let channel = interaction.options.getChannel('channel');
		let terminate = interaction.options.getBoolean('terminate');

		if (!interaction.guildId || !interaction.guild) throw new Error('Guild undetected.');
		if (!channel) throw new Error('Elected channel undetected.');

		if ((terminate && prompt.dailyIntvId !== null) || (terminate && targetChannel && (targetChannel as Config).promptChannelId.includes("XNULL") === false)) {
			interaction.reply({ content: 'Prompter terminated.', ephemeral: true});

			let nullifyCh = await prisma.config.update({
				where: {
					channel_target: {
						serverId: interaction.guildId,
						promptChannelId: channel.id,
					},
				},
				data: {
					promptChannelId: `${channel.id}XNULL`
				}
			});

			return clearTimeout(prompt.dailyIntvId as NodeJS.Timeout);
		} else if (terminate && !(typeof prompt.dailyIntvId === 'number')) {
			return interaction.reply({ content: 'Prompter wasn\'t initialized.', ephemeral: true});
		}

		let isListed: boolean = false;
		targetChannel = await prisma.config.findUnique({ 
			where: { 
				channel_target: {
					serverId: interaction.guildId, 
					promptChannelId: channel.id,
				}
			},
		});
		if (targetChannel) {
			isListed = true;
			return interaction.reply({ content: 'Channel is already set', ephemeral: true });
		} else {
			console.error(`ERR: Unable to retrieve channel config, attempting creation...`)
			try {
				if (prompt.dailyIntvId !== null) clearTimeout(prompt.dailyIntvId);

				let serverData = {
					serverId: interaction.guildId,
					guildName: interaction.guild.toString(),
				}
				initServer = await prisma.server.upsert({
					where: { serverId: interaction.guildId },
					update: { guildName: serverData.guildName },
					create: serverData,
				});
				console.log(`Server Initialized.\n${initServer}`);
				if (!interaction.guildId || !channel.id) return;

				let configData = {
					promptChannelId: channel.id,
					server: {
						connect: {
							serverId: interaction.guildId,
						}
					}
				};

				let initConfig = await prisma.config.upsert({
					where: {
						serverId: interaction.guildId,
					},
					update: { 
						promptChannelId: channel.id,
					},
					create: configData as Prisma.ConfigCreateInput,
				});
				console.log(initConfig);
			} catch (err) {
				console.error(`Elected channel may already be listed: ${err}`);
			} finally {
				if (!isListed) {
					targetChannel = await prisma.config.findUnique({ 
						where: { 
							channel_target: {
								serverId: interaction.guildId, 
								promptChannelId: channel.id,
							}
						},
					});

					if (targetChannel === null) throw new Error ('Unable to create AND retrieve channel config.');
					// Begin auto-post
					targetChannel = interaction.guild.channels.cache.get((targetChannel as Config).promptChannelId) as GuildBasedChannel as TextChannel;
					try {
						interaction.reply({ content: 'Channel set.', ephemeral: true });
						await targetChannel.sendTyping();
						await prompt.execute(interaction);
						isListed = true;
					} catch (err) {
						console.error(err);
						interaction.reply('Unable to utilize channel, ensure correct permissions.')
					} 
					console.log(targetChannel);
				}
			}
		}
	} 
};
