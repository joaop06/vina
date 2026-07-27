export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { runDataMigrations } = await import(
    "@/src/lib/data/migrations/runner"
  );
  const summary = await runDataMigrations({ trigger: "startup" });
  if (summary.applied.length > 0) {
    console.info("[migrations] startup applied:", summary.applied.join(", "));
  }
}
