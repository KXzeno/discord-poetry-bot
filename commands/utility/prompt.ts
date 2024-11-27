import { TextChannel, SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { scheduler } from "timers/promises";

import db from '../../prisma/db.ts';

type DailyIntv = NodeJS.Timeout | number | null;

export const command = {
	data: new SlashCommandBuilder()
	.setName('prompt')
	.setDescription('sends daily prompt'),
	dailyIntvId: null as DailyIntv,
	async execute(interaction: ChatInputCommandInteraction) {
		/** @remarks
		 * Embed dispreferred by client 
		 * let embed = new EmbedBuilder()
		 * .setColor(0x6A5ACD)
		 * .setTitle('Unshackling a long-kept burden')
		 * .setDescription('<@&1307854401045790830>')
		 * .setAuthor({ name: `Daily Prompt #2` });
		 * interaction.reply({ embeds: [embed] });
		 */

		// Missing 1.28
		let promptsData = await db.prompts.findMany();

		function getCurrRelMonthDay(): string {
			let now: Date = new Date();
			/** @see {@link https://unicode.org/reports/tr35/#Time_Zone_Identifiers} */
				let locale = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles'});
			let splicedLocale = locale.split(/\//);
				return `${splicedLocale[0]}.${splicedLocale[1]}`;
		}

		async function getCurrPrompt(): Promise<string | null> {
			let target = promptsData.find(entry => entry.date === getCurrRelMonthDay());
			if (target !== undefined) {
				return `# Daily Prompt No. ${target.id}: ${target.prompt}\n<@&1307854401045790830>`;
			} else {
				return null;
			}
		}

		async function adjustTimer(): Promise<number | null> {
			let now: Date = new Date();
			let relTime = -(8 * 60 * 60 * 1000) + now.getUTCHours() * 60 * 60 * 1000 +
				(now.getUTCMinutes() * 60 * 1000) + 
				(now.getUTCSeconds() * 1000) + now.getUTCMilliseconds();

			return reset = (relTime < offset) ?
				offset - relTime : targetMs - (relTime % dailyMs);
		}


		async function intvFn(channel: TextChannel): Promise<void> {
			if (command.dailyIntvId) clearTimeout(command.dailyIntvId);

			let nextPrompt: string | null = await getCurrPrompt();

			if (nextPrompt === null) throw new Error('Unable to retrieve prompt.');
			channel.send(nextPrompt);

			// debounce for pseudo rate limit
			await scheduler.wait(300);

			await adjustTimer();
			if (reset === null) throw new Error('Unable to adjust timer.');
			command.dailyIntvId = setTimeout(() => intvFn(channel), reset);
		}

		let dailyMs: number = 24 * 60 * 60 * 1000;
		let offset: number = 7 * 60 * 60 * 1000; 
		let targetMs: number = dailyMs + offset;
		let reset: number | null = null;

		switch (interaction.commandName) {
			case 'prompt': {
				let prompt: string | null = await getCurrPrompt();
				if (prompt === null) {
					interaction.reply({ content: 'Prompt not found.', ephemeral: true });
					return;
				} else {
					return interaction.reply(prompt);
				}
			};
			case 'setpromptchannel': {
				if (!interaction.guildId) throw new Error('Guild ID unobtainable');
				let config = await db.config.findUnique({
					where: { serverId: interaction.guildId },
				});

				// @ts-ignore
				let channel: TextChannel = interaction.guild.channels.cache.get(config.promptChannelId);
				let prompt: string | null = await getCurrPrompt();
				if (prompt === null) {
					interaction.reply({ content: 'Prompt not found.', ephemeral: true });
					return;
				} else {
					await adjustTimer();
					if (reset === null) throw new Error('Unable to adjust timer.');
					command.dailyIntvId = setTimeout(() => intvFn(channel), reset);
				}
			};
		}

	}
}
