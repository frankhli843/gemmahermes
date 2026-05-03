# GemmaHermes Benchmark

GemmaHermes inherits the full benchmark suite from [gemmaclaw](https://github.com/gemmaclaw/gemmaclaw). The `gemmaclaw benchmark` command works as-is after building.

For task packs, scoring methodology, CLI flags (quick, sweep, upload), result schema, and config selection, see the [Benchmark Kit documentation](https://github.com/gemmaclaw/gemmaclaw/tree/main/src/gemmaclaw/benchmark-kit).

## Hermes Models

### Ollama Tags

- `hermes3:8b` (default, Llama 3.1 8B base)
- `hermes3:70b` (Llama 3.1 70B base, needs 40GB+ VRAM)
- `hermes3:1b` (small, fast, CPU-friendly)
- `hermes3:3b` (balanced for modest hardware)

### GGUF Variants (llama.cpp)

- `Hermes-3-Llama-3.1-8B.Q4_K_M.gguf` (default, 4.9 GB)
- `Hermes-3-Llama-3.1-8B.Q5_K_M.gguf` (higher quality, 5.7 GB)
- `Hermes-3-Llama-3.1-8B.Q8_0.gguf` (near-lossless, 8.5 GB)

## Quick Run

```bash
gemmaclaw benchmark --model hermes3:8b
gemmaclaw benchmark --model hermes3:8b --quick
gemmaclaw benchmark --model hermes3:8b --mock
```

Hermes 3 uses the ChatML prompt format and supports function calling natively via tool-use tokens.

## Hardware Tiers

| Tier    | GPU              | RAM   | Recommended Model |
| ------- | ---------------- | ----- | ----------------- |
| High    | RTX 3090+ (24GB) | 32GB+ | hermes3:70b Q4    |
| Medium  | RTX 3060+ (12GB) | 16GB+ | hermes3:8b Q8     |
| Low     | No GPU           | 8GB+  | hermes3:1b Q4     |
| Minimal | No GPU           | 4GB   | hermes3:1b Q2     |
