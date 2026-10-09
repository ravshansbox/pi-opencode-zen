# pi-opencode-zen

OpenCode Zen provider extension for pi.

## Install

### Option 1: From GitHub (Branch `fix/pi-compat-import`)

To install the latest tested fix branch directly:

```bash
# Clone the fix branch
git clone -b fix/pi-compat-import https://github.com/danprat/pi-opencode-zen.git

# Install into pi
pi install ./pi-opencode-zen
```

Or install directly from the git repository:

```bash
pi install git:github.com/danprat/pi-opencode-zen
```

### Option 2: From npm (Official Release)

```bash
pi install npm:@ravshansbox/pi-opencode-zen
```

## Usage

Pi loads the provider from `./index.ts` and registers an `opencode-zen` provider that exposes OpenCode Zen models.

The extension:

- supports anonymous mode by using the API key value `public`
- adds OpenCode request headers on every `opencode-zen` provider request:
  - `x-opencode-client`
  - `x-opencode-session`
  - `x-opencode-project`
  - `x-opencode-request`
- sets the OpenCode CLI-style `User-Agent`
- attaches required core tools (`bash`, `read`) to satisfy the OpenCode free-tier validation gate

### Model filtering and protocol routing

This extension mirrors OpenCode CLI behaviour as closely as possible:

- it fetches live visible model IDs dynamically from the OpenCode Zen API
- it synchronises model specifications (context window, token limits, modalities) from `models.dev`
- it filters out models with `status === "deprecated"`
- in anonymous/public mode (`key = "public"`), it automatically admits all free-tier and zero-cost models
- it dynamically routes model families to their supported protocols:
  - `openai-responses` for GPT and Meta Muse Spark series
  - `anthropic-messages` for Claude series
  - `google-generative-ai` for Gemini series
  - `openai-completions` for standard models

Live model visibility source:

```bash
curl -H 'Authorization: Bearer public' https://opencode.ai/zen/v1/models
```

OpenCode metadata source:

```bash
curl https://models.dev/api.json
```

The Zen `/models` endpoint does not include pricing or deprecation metadata, so the extension combines both sources.

## Configuration

Get an API key from OpenCode Zen, then configure pi in one of these ways.

### Environment variable

```bash
export OPENCODE_API_KEY=your-real-key
```

To use anonymous mode for OpenCode Zen free/public models:

```bash
export OPENCODE_API_KEY=public
```

### pi auth storage

Store the key in `~/.pi/agent/auth.json` under the `opencode-zen` provider name:

```json
{
  "opencode-zen": {
    "type": "api_key",
    "key": "your-real-key"
  }
}
```

Use `"key": "public"` for anonymous mode.

## Development

```bash
npm install
npm run check
```
