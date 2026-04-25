import type { BackendId } from "./types.js";

export type RuntimeArtifact = {
  version: string;
  urlTemplate: string;
  sha256?: Record<string, string>;
};

export type ModelArtifact = {
  id: string;
  displayName: string;
  backend: BackendId;
  /** For Ollama: the tag to pull (e.g. "gemma3:1b"). */
  ollamaTag?: string;
  /** For llama.cpp / gemma.cpp: direct download URL. */
  url?: string;
  /** Expected sha256 of the downloaded model file. */
  sha256?: string;
  /** Approximate download size in bytes. */
  sizeBytes?: number;
};

// -----------------------------------------------------------------------
// Runtime binaries
// -----------------------------------------------------------------------

export const OLLAMA_RUNTIME: RuntimeArtifact = {
  version: "0.6.2",
  urlTemplate:
    "https://github.com/ollama/ollama/releases/download/v{version}/ollama-linux-{arch}.tgz",
};

export const LLAMACPP_RUNTIME: RuntimeArtifact = {
  version: "b5460",
  urlTemplate:
    "https://github.com/ggerganov/llama.cpp/releases/download/{version}/llama-{version}-bin-ubuntu-x64.zip",
};

export const GEMMACPP_REPO = "https://github.com/google/gemma.cpp";
export const GEMMACPP_TAG = "main";

// -----------------------------------------------------------------------
// Default models (smallest known-working for each backend)
// -----------------------------------------------------------------------

export const DEFAULT_MODELS: Record<BackendId, ModelArtifact> = {
  ollama: {
    id: "hermes3:8b",
    displayName: "Hermes 3 8B (Ollama)",
    backend: "ollama",
    ollamaTag: "hermes3:8b",
    sizeBytes: 4_900_000_000,
  },
  "llama-cpp": {
    id: "Hermes-3-Llama-3.1-8B.Q4_K_M",
    displayName: "Hermes 3 Llama 3.1 8B Q4_K_M (GGUF)",
    backend: "llama-cpp",
    url: "https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B-GGUF/resolve/main/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf",
    sizeBytes: 4_920_000_000,
  },
  "gemma-cpp": {
    id: "gemma-2b",
    displayName: "Gemma 2B (gemma.cpp)",
    backend: "gemma-cpp",
    sizeBytes: 2_500_000_000,
  },
};

export function resolveOllamaBinaryUrl(): string {
  const arch = process.arch === "x64" ? "amd64" : "arm64";
  return OLLAMA_RUNTIME.urlTemplate
    .replace("{version}", OLLAMA_RUNTIME.version)
    .replace("{arch}", arch);
}

export function resolveLlamaCppUrl(): string {
  return LLAMACPP_RUNTIME.urlTemplate.replace(/{version}/g, LLAMACPP_RUNTIME.version);
}
