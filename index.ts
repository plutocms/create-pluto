import { text, select, spinner, log } from "@clack/prompts";
import { downloadTemplate } from "giget";

const cwd = process.cwd();

await text({
  message: "Website title:",
  placeholder: "My Awesome Website",
  defaultValue: "My Awesome Website",
});

const databaseProvider = await select({
  message: "Pick a database provider.",
  options: [
    { value: "supabase", label: "Supabase" },
    { value: "mysql", label: "MySQL" },
  ],
});

if (databaseProvider === "supabase") {
  await setupSupabase();
}

async function setupSupabase() {
  let supabaseUrl;
  let supabaseKey;

  while (!supabaseUrl) {
    supabaseUrl = await text({
      message: "Type/Paste your Supabase URL:",
    });

    if (!supabaseUrl || typeof supabaseUrl !== "string") {
      log.error("Supabase URL is required.");
    }
  }

  while (!supabaseKey) {
    supabaseKey = await text({
      message: "Type/Paste your Supabase Key:",
    });

    if (!supabaseKey || typeof supabaseKey !== "string") {
      log.error("Supabase Key is required.");
    }
  }
}

const s = spinner();

s.start("Setting things up...");

const { source, dir } = await downloadTemplate("github:unjs/template");

s.stop("All done!");

log.success("Setup complete! 🎉");
