---
title: MCP server
description: Connect Claude, Codex, Cursor and other AI assistants to your aqora account.
---

aqora exposes a [Model Context Protocol](https://modelcontextprotocol.io) server at
`https://aqora.io/mcp`. Any MCP client that speaks the Streamable HTTP transport and OAuth can
connect to it: the client registers itself, opens the aqora consent page in your browser, and keeps
its own tokens refreshed from then on.

Once connected, the assistant gets one tool, `run_graphql`, which runs queries and mutations
against the full aqora GraphQL API as you, plus the API schema as a resource so it can discover
what is available on its own. Ask it things like "list my workspaces", "show the leaderboard for
competition X" or "how many jobs did I run on the H2 emulator this week".

:::caution[Full account access]
An assistant connected this way can do everything your account can, including possibly non-reversible actions. The consent page says so before you click **Allow**. Only connect clients you trust, and remove the server from the client when you no longer need it.
:::

## Claude Code

```bash
claude mcp add --transport http aqora https://aqora.io/mcp
```

Then, inside a Claude Code session, run `/mcp`, pick `aqora` and choose **Authenticate**. Add
`-s user` to the command above to make the server available in every project.

## Claude Desktop and claude.ai

Go to **Customize › Connectors**, click **+** and then **Add custom connector**, enter
`https://aqora.io/mcp`, and click **Add**. Click **Connect** to open the consent page. On Team and
Enterprise plans an owner adds the connector under **Organization settings › Connectors** first.

## Codex CLI

```bash
codex mcp add aqora --url https://aqora.io/mcp
```

You may also need to authenticate the MCP with

```bash
codex mcp login aqora
```

## Gemini CLI

```bash
gemini mcp add --transport http aqora https://aqora.io/mcp
```

Then run `/mcp auth aqora` inside Gemini CLI to open the consent page.

## Cursor

Add the server to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project):

```json
{
  "mcpServers": {
    "aqora": {
      "url": "https://aqora.io/mcp"
    }
  }
}
```

Cursor then asks you to log in from its MCP settings.

## VS Code

Add the server to `.vscode/mcp.json`:

```json
{
  "servers": {
    "aqora": {
      "type": "http",
      "url": "https://aqora.io/mcp"
    }
  }
}
```

VS Code starts the login the first time it starts the server.

## Other clients and scripts

Any client that supports remote MCP servers with OAuth works with just the URL; the server publishes
its metadata at `https://aqora.io/.well-known/oauth-authorization-server` and registers clients
dynamically.
