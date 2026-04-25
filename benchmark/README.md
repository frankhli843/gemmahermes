# GemmaHermes Benchmark

Benchmarking Hermes models for autonomous AI agent tasks. Uses the [jake-benchmark](https://github.com/frankhli843/jake-benchmark) harness adapted for Hermes model variants.

## Hermes Models to Benchmark

### Ollama Tags
- `hermes3:8b` (default, Llama 3.1 8B base)
- `hermes3:70b` (Llama 3.1 70B base, needs 40GB+ VRAM)
- `hermes3:1b` (small, fast, CPU-friendly)
- `hermes3:3b` (balanced for modest hardware)

### GGUF Variants (llama.cpp)
- `Hermes-3-Llama-3.1-8B.Q4_K_M.gguf` (default, 4.9 GB)
- `Hermes-3-Llama-3.1-8B.Q5_K_M.gguf` (higher quality, 5.7 GB)
- `Hermes-3-Llama-3.1-8B.Q8_0.gguf` (near-lossless, 8.5 GB)

## Running Benchmarks

### Prerequisites
- jake-benchmark harness (clone from GitHub)
- Ollama or llama.cpp with a Hermes model loaded

### Quick Run

```bash
# Using the jake-benchmark harness
cd /path/to/jake-benchmark/harness
docker run jake-harness benchmark hermes3:8b medium
```

### Model Configuration

GemmaHermes models use the ChatML prompt format by default:
```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
{prompt}<|im_end|>
<|im_start|>assistant
```

Hermes 3 supports function calling natively via tool-use tokens.

## Hardware Tiers

| Tier | GPU | RAM | Recommended Model |
|------|-----|-----|-------------------|
| High | RTX 3090+ (24GB) | 32GB+ | hermes3:70b Q4 |
| Medium | RTX 3060+ (12GB) | 16GB+ | hermes3:8b Q8 |
| Low | No GPU | 8GB+ | hermes3:1b Q4 |
| Minimal | No GPU | 4GB | hermes3:1b Q2 |

## Results

Benchmark results will be published to GitHub Pages as they are collected.
