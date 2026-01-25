import { cancel, confirm, isCancel, log, select, spinner, text } from "@clack/prompts";
import { downloadTemplate } from "giget";
import fs from "fs";

//#region src/index.ts
const cwd = process.cwd();
const templateDir = await text({
	message: "Where do you want to create your Pluto project?",
	placeholder: "./my-pluto-project",
	defaultValue: "my-pluto-project"
});
if (isCancel(templateDir)) {
	cancel("Operation cancelled.");
	process.exit(0);
}
const templatePath = `${cwd}/${templateDir}`;
if (!fs.existsSync(templatePath)) fs.mkdirSync(templatePath, { recursive: true });
const websiteTitle = await text({
	message: "Website title:",
	placeholder: "My Awesome Website",
	defaultValue: "My Awesome Website"
});
if (isCancel(websiteTitle)) {
	cancel("Operation cancelled.");
	process.exit(0);
}
const databaseProvider = await select({
	message: "Pick a database provider.",
	options: [{
		value: "supabase",
		label: "Supabase"
	}, {
		value: "mysql",
		label: "MySQL"
	}]
});
if (isCancel(databaseProvider)) {
	cancel("Operation cancelled.");
	process.exit(0);
}
let supabaseUrl;
let supabaseKey;
if (databaseProvider === "supabase") await setupSupabase();
async function setupSupabase() {
	while (!supabaseUrl) {
		supabaseUrl = await text({ message: "Type/Paste your Supabase URL:" });
		if (!supabaseUrl || typeof supabaseUrl !== "string") log.error("Supabase URL is required.");
	}
	while (!supabaseKey) {
		supabaseKey = await text({ message: "Type/Paste your Supabase Key:" });
		if (!supabaseKey || typeof supabaseKey !== "string") log.error("Supabase Key is required.");
	}
}
const s = spinner();
if (fs.existsSync(`${cwd}/nuxt.config.ts`)) {
	if (!await confirm({ message: "Nuxt project detected. Do you want to add Pluto environment variables?" })) process.exit(0);
}
log.success("Configuration successful! Proceeding with setup...");
s.start("Downloading Pluto template...");
const { source } = await downloadTemplate("gh:plutocms/pluto-supabase-shop-template", { dir: templatePath });
log.info(`Template downloaded from ${source}`);
const envPath = `${cwd}/${templateDir}/.env`;
const envVars = { PLUTO_WEBSITE_TITLE: websiteTitle?.toString() ?? "" };
if (databaseProvider === "supabase") {
	envVars.SUPABASE_PROJECT_ID = supabaseUrl ? supabaseUrl.toString().split("//")[1]?.split(".")[0] ?? "" : "";
	envVars.SUPABASE_URL = supabaseUrl?.toString() ?? "";
	envVars.SUPABASE_KEY = supabaseKey?.toString() ?? "";
}
try {
	let envContent = "";
	if (fs.existsSync(envPath)) {
		envContent = fs.readFileSync(envPath, "utf-8");
		Object.entries(envVars).forEach(([key, value]) => {
			const regex = new RegExp(`^${key}=.*$`, "m");
			if (regex.test(envContent)) envContent = envContent.replace(regex, `${key}="${value}"`);
			else envContent += `\n${key}="${value}"`;
		});
	} else {
		envContent = "# Pluto Configurations\n";
		Object.entries(envVars).forEach(([key, value]) => {
			envContent += `${key}="${value}"\n`;
		});
	}
	fs.writeFileSync(envPath, envContent.trim() + "\n");
} catch (error) {
	log.error(`Failed to write to .env file: ${error}`);
	process.exit(1);
}
s.stop("All done!");
log.success("Setup complete! 🎉");
log.info(`Nuxt project created in: ${templateDir}`);

//#endregion
export {  };