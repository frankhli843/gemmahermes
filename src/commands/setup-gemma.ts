import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";

export type SetupGemmaCommandOpts = {
  advanced?: boolean;
};

export async function setupGemmaCommand(
  opts: SetupGemmaCommandOpts,
  runtime: RuntimeEnv = defaultRuntime,
): Promise<void> {
  // Lazy-load to keep CLI startup fast.
  const { detectHardware, detectSystemTools, formatHardwareInfo } =
    await import("../gemmahermes/provision/hardware.js");
  const { selectQuickProfile, runAdvancedWizard, createStdioWizardIO, formatModelSize } =
    await import("../gemmahermes/provision/setup-wizard.js");
  const { provision, verifyCompletion } = await import("../gemmahermes/provision/provision.js");
  const { DEFAULT_MODELS } = await import("../gemmahermes/provision/model-registry.js");

  runtime.log("");
  runtime.log("Detecting hardware...");

  const hw = detectHardware();
  const tools = detectSystemTools();

  for (const line of formatHardwareInfo(hw)) {
    runtime.log(line);
  }

  let profile;

  if (opts.advanced) {
    // Advanced: interactive prompts.
    const io = createStdioWizardIO();
    try {
      profile = await runAdvancedWizard(io, hw, tools);
    } finally {
      io.close();
    }
  } else {
    // Quick: auto-select the safest backend.
    profile = selectQuickProfile(hw, tools);
    const model = DEFAULT_MODELS[profile.backend];
    runtime.log("");
    runtime.log(`Recommended: ${model.displayName} (${formatModelSize(model.sizeBytes)} download)`);
    runtime.log(`  ${profile.reason}`);
  }

  runtime.log("");
  runtime.log(`Provisioning ${profile.backend} on port ${profile.port}...`);

  const progress = (msg: string) => runtime.log(msg);

  try {
    const result = await provision({
      backend: profile.backend,
      model: profile.model,
      port: profile.port,
      progress,
    });

    // Smoke test.
    runtime.log("");
    runtime.log("Running smoke test...");
    const verification = await verifyCompletion(result.handle.apiBaseUrl, result.modelId);

    if (verification.ok) {
      runtime.log(`Smoke test passed. Response: "${verification.content}"`);
      runtime.log("");
      runtime.log("Setup complete! Your Hermes assistant is ready.");
      runtime.log(`  API: ${result.handle.apiBaseUrl}/v1/chat/completions`);
      runtime.log(`  Model: ${result.modelId}`);
      runtime.log(`  PID: ${result.handle.pid}`);
      runtime.log("");
      runtime.log(`To stop it: kill ${result.handle.pid}`);
    } else {
      runtime.error(`Smoke test failed: ${verification.error}`);
      runtime.error("The backend started but could not generate a response.");
      runtime.error(
        "Try running again or use 'gemmahermes setup --advanced' to pick a different backend.",
      );
      await result.handle.stop();
      runtime.exit(1);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    runtime.error(`Setup failed: ${message}`);
    runtime.error("");
    runtime.error("Troubleshooting:");
    runtime.error("  - Check network connectivity (runtimes and models are downloaded)");
    runtime.error("  - Try 'gemmahermes setup --advanced' to pick a different backend");
    runtime.error("  - See 'gemmahermes provision --help' for manual control");
    runtime.exit(1);
  }
}
