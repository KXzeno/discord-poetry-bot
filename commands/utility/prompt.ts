import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

import prisma from '../../prisma/db.ts';

export const command = {
	data: new SlashCommandBuilder()
	.setName('prompt')
	.setDescription('automates poetry prompt msgs'),
	async execute(interaction: ChatInputCommandInteraction) {
		// 	interaction.reply('# Daily Prompt No. 1: Being harmonious in an inhospitable environment\n<@&1307854401045790830>')
		// }
		let embed = new EmbedBuilder()
		.setColor(0x6A5ACD)
		.setTitle('Unshackling a long-kept burden')
		.setDescription('<@&1307854401045790830>')
		.setAuthor({ name: `Daily Prompt #2` });

		interaction.reply({ embeds: [embed] });
	}
}
