import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// const dir = dirname(import.meta.filename)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

const commands: string[] = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

let importPromises = [];

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const fileURL = new URL(`file://${filePath}`);
		importPromises.push(
		import(fileURL.toString()).then(module => {
			const { command } = module;
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}).catch(error => {
			console.error(`[ERROR] Failed to import command file at ${filePath}: ${error}`);
		}));
	}
}

await Promise.all(importPromises);

// Construct and prepare an instance of the REST module
if (process.env.TOKEN === undefined) throw new Error('Missing or Invalid Token');
const rest = new REST().setToken(process.env.TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		if (process.env.CLIENT_ID === undefined) throw new Error('Missing or Invalid Client ID');
		if (process.env.GUILD_ID === undefined) throw new Error('Missing or Invalid Guild ID');
		// The put method is used to fully refresh all commands in the guild with the current set
		const data: unknown = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			// Routes.applicationCommands(process.env.CLIENT_ID), // For Global Deployment
			{ body: commands },
		);

		console.log(`Successfully reloaded ${(data as object[]).length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
