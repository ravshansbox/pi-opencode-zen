# pi-opencode-zen

OpenCode Zen provider extension for pi.

## Install

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

### Model filtering

This extension mirrors OpenCode CLI behaviour as closely as possible:

- it fetches the live visible model IDs from the OpenCode Zen API
- it fetches OpenCode provider metadata from `models.dev`
- it filters out models with `status === "deprecated"`
- in anonymous/public mode (`key = "public"`), it keeps only models where `models.dev` reports `cost.input === 0`

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
