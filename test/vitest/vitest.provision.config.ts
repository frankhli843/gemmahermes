import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createProvisionVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["src/gemmahermes/**/*.test.ts"], {
    dir: "src/gemmahermes",
    env,
    name: "provision",
  });
}

export default createProvisionVitestConfig();
