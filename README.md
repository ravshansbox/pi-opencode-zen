# pi-opencode-zen

`pi-opencode-zen` is a pi extension package extracted from `pi-mono` and adapted into a standalone extension.

It registers the `opencode-zen` provider for pi and exposes OpenCode Zen models through pi's provider system.

## Install

Install it as a pi package:

```bash
pi install git:github.com/ravshansbox/pi-opencode-zen
```

After installation, reload pi if needed.

## Behavior

This extension:

- is extracted from `pi-mono`
- registers the `opencode-zen` provider from a standalone package
- supports anonymous mode by using the API key value `public`
- adds OpenCode request headers on every `opencode-zen` provider request:
  - `x-opencode-client`
  - `x-opencode-session`
  - `x-opencode-project`
  - `x-opencode-request`
- sets the OpenCode CLI-style `User-Agent`

## Authentication

Get an API key from OpenCode Zen, then configure pi in one of these ways.

### Environment variable

Set:

```bash
export OPENCODE_API_KEY=your-real-key
```

To use anonymous mode for OpenCode Zen free/public models, set:

```bash
export OPENCODE_API_KEY=public
```

### pi auth storage

You can also store the key in pi's auth file under the `opencode-zen` provider name:

`~/.pi/agent/auth.json`

Example:

```json
{
  "opencode-zen": {
    "type": "api_key",
    "key": "your-real-key"
  }
}
```

Anonymous mode in auth storage:

```json
{
  "opencode-zen": {
    "type": "api_key",
    "key": "public"
  }
}
```

## Package entry

This is a proper pi extension package. The extension entry point is declared in `package.json`:

```json
{
  "pi": {
    "extensions": ["./src/index.ts"]
  }
}
```

## Source layout

- `src/index.ts` — extension entry point
- `package.json` — pi package metadata
