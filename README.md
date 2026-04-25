# GemmaHermes

One command to a working local Hermes assistant, regardless of your hardware.

```bash
npm install -g github:gemmahermes/gemmahermes#main
gemmahermes setup     # detect hardware, download model, verify
gemmahermes chat      # start chatting
```

Requires Node.js 22+. No pre-installed Ollama or llama.cpp needed.

---

GemmaHermes detects your hardware (GPU, CPU, RAM), picks the best model, quantization, and backend, and gets a working [Hermes](https://nousresearch.com/hermes/)-based assistant running without any manual tuning. CPU-only setups are first-class, not an afterthought.

Built on top of [OpenClaw](https://github.com/openclaw/openclaw). Volunteer-driven, Hermes-first.

## Chatting with your assistant

After setup, start a conversation:

```bash
gemmahermes chat
```

This opens a terminal chat interface connected to your local Hermes model. Type messages, see responses with markdown rendering, and conversation history is preserved across the session.

You can also send a single message directly:

```bash
gemmahermes chat --message "What can you help me with?"
```

Options:

| Flag | Description |
|------|-------------|
| `--message <text>` | Send an initial message after connecting |
| `--session <key>` | Session key (default: "main") |
| `--thinking <level>` | Thinking level override |
| `--history-limit <n>` | History entries to load (default: 200) |
| `--timeout-ms <ms>` | Agent timeout in milliseconds |

## Setup details

### Quick setup (recommended)

```bash
npm install -g github:gemmahermes/gemmahermes#main
gemmahermes setup
```

The setup command detects your hardware, picks the best backend, downloads the model, and runs a smoke test. When it finishes, your Hermes assistant is ready.

### Advanced setup

Step-by-step prompts to override backend, model, and port:

```bash
gemmahermes setup --advanced
```

### Developer install

If you want to hack on GemmaHermes itself, clone and build from source. You will need [pnpm](https://pnpm.io/installation) in addition to Node.js.

```bash
git clone https://github.com/gemmahermes/gemmahermes.git
cd gemmahermes
pnpm install
pnpm build
gemmahermes setup
```

From a dev install you can also run commands directly via `node gemmahermes.mjs <command>`.

### Example setup output

```
Detecting hardware...
  CPU: x64, 12 cores (AMD Ryzen 9 5900X)
  RAM: 31.3 GB total, 22.1 GB available
  GPU: NVIDIA RTX 3090 (24 GB VRAM)

Recommended: Hermes 3 8B Q4_K_M (Ollama) (4.9 GB download)
  NVIDIA GPU detected. Ollama provides the best GPU acceleration.

Provisioning ollama on port 11434...
[Ollama] Runtime started on port 11434 (PID 12345).
[Ollama] Model ready.

Smoke test passed. Response: "Hello!"

Setup complete! Your Hermes assistant is ready.
  API: http://127.0.0.1:11434/v1/chat/completions
  Model: hermes3:8b
  PID: 12345
```

## How it works

1. **Hardware detection.** GemmaHermes probes your system: GPU vendor and VRAM, CPU architecture, total and available RAM.
2. **Tier classification.** Based on what it finds, your machine is slotted into a hardware tier (e.g., "16 GB VRAM, mid-range GPU" or "CPU-only, 8 GB RAM").
3. **Profile selection.** Each tier maps to a tested configuration profile: which backend to use (Ollama or llama.cpp), which Hermes model size, and which quantization level.
4. **Provisioning.** GemmaHermes pulls the model and configures the backend automatically.
5. **Verification.** A quick smoke test confirms the setup works: inference runs, latency is acceptable, and tool-use prompts parse correctly.

If something does not fit (too little RAM, unsupported GPU), GemmaHermes tells you what it tried and why it fell back, rather than silently degrading.

## What is Hermes?

[Hermes](https://nousresearch.com/hermes/) is a family of fine-tuned language models by [NousResearch](https://nousresearch.com/), optimized for instruction following, function calling, and structured output. Hermes models are available in multiple sizes and run on standard GGUF-compatible backends (Ollama, llama.cpp).

## Non-GPU support

CPU-only is a first-class path, not a fallback afterthought.

- Hermes models run on CPU via llama.cpp with competitive performance on machines with 8 GB or more RAM.
- Smaller Hermes variants (1B, 3B) are well-suited for constrained hardware.
- The goal is that someone with a laptop and no discrete GPU can still get a useful local assistant running Hermes.

## Manual provisioning

`gemmahermes provision` is the low-level primitive. Use it when you know exactly what you want:

```bash
# Ollama (recommended for GPU setups)
gemmahermes provision --backend ollama

# llama.cpp (flexible quants, GGUF format)
gemmahermes provision --backend llama-cpp
```

## API access

After setup or provisioning, the backend exposes a local chat completions endpoint:

```bash
curl http://127.0.0.1:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"hermes3:8b","messages":[{"role":"user","content":"Say hello"}]}'
```

Default ports: Ollama = 11434, llama.cpp = 8080.

The API follows the [OpenAI Chat Completions format](https://platform.openai.com/docs/api-reference/chat/create), so any client or library that speaks that protocol will work out of the box.

## Troubleshooting

- **Ollama download fails**: check network connectivity. The binary is downloaded from GitHub releases.
- **llama.cpp server won't start**: verify the model file exists at `~/.gemmahermes/models/llama-cpp/`. Re-run provision to re-download.
- **"Healthcheck failed"**: the backend process started but did not respond in time. Check system resources (RAM, disk).
- **Port already in use**: another process is using the default port. Use `--port <N>` to pick a different one, or use advanced setup.

## Data directory

All managed runtimes and models are stored under `~/.gemmahermes/` (override with `GEMMAHERMES_HOME`):

```
~/.gemmahermes/
  runtimes/       # Downloaded/built backend binaries
  models/         # Downloaded model files
```

## Running E2E tests in Docker

To verify all backends work from a clean environment:

```bash
# Build the E2E image
docker build -f test/e2e/Dockerfile.provision -t gemmahermes-provision-e2e .

# Test individual backends (direct provision + agent run)
docker run --rm gemmahermes-provision-e2e ollama
docker run --rm gemmahermes-provision-e2e llama-cpp

# Test all
docker run --rm gemmahermes-provision-e2e all
```

## Roadmap

**Phase 1: Evidence.** Benchmark Hermes models across hardware tiers, backends, and quantizations. Document what actually works, how fast, and at what quality. No opinions without data.

**Phase 2: Productization.** Build the auto-detection and profile-selection tooling. Ship a `gemmahermes doctor` command that diagnoses your system and recommends (or provisions) the right setup. Package tested profiles so they work out of the box.

**Phase 3: Community loop.** Open the profile registry to contributions. Users report what works on their hardware, profiles get refined, coverage grows. A working group keeps the evidence current as new Hermes releases land.

Phase 2 tooling is live. Phase 1 benchmarks continue in parallel. Contributions and hardware reports are welcome.

## Contributing

Issues and pull requests are welcome. Keep contributions small, reproducible, and backed by data where possible. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Links

- [Upstream OpenClaw](https://github.com/openclaw/openclaw) (the framework GemmaHermes is built on)
- [OpenClaw docs](https://docs.openclaw.ai) (optional reference for advanced configuration)
- [NousResearch Hermes](https://nousresearch.com/hermes/) (the model family GemmaHermes targets)
- [Ollama](https://ollama.com/) (recommended backend for GPU setups)

## Disclaimer

This project is composed of volunteers. GemmaHermes is not affiliated with NousResearch or any other organization. This is a volunteer project intended to help empower people with AI, leveraging Hermes models.
