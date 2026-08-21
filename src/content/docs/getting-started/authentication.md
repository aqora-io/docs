---
title: Authentication
description: Log in to aqora from the CLI and Python.
---

Submitting jobs and accessing your data on [aqora.io](https://aqora.io) requires an authenticated
session. One login covers both the CLI and the aqora Python library.

:::tip[Already authenticated in aqora workspaces]
Inside a marimo notebook in an aqora.io workspace there is nothing to do: the workspace is already
authenticated on your behalf, so `aqora login` is not needed and the Python library works out of
the box.
:::

## Log in

```bash
aqora login
```

This opens your browser to authorize the CLI with your aqora account. If no browser can be opened,
the CLI prints the authorization URL along with a QR code you can scan from another device.

### Without a browser

On a machine where completing a browser flow isn't possible at all — over SSH, for example — log
in with your username and password directly in the terminal:

```bash
aqora login --interactive
```

## Where credentials are stored

Credentials are saved in your platform's data directory and refreshed automatically when they
expire:

| OS      | Path                                             |
| ------- | ------------------------------------------------ |
| Linux   | `~/.local/share/aqora/credentials.json`          |
| macOS   | `~/Library/Application Support/aqora/credentials.json` |
| Windows | `%APPDATA%\aqora\credentials.json`               |

The location can be overridden with `--config-home` or the `AQORA_CONFIG_HOME` environment
variable.

The aqora Python library reads the same file, so after `aqora login` you can use
`from aqora import QPU` without any further setup.

## Access tokens for scripts

To use your session outside the CLI — with `curl` or another API client — print a valid access
token (refreshing it first if needed):

```bash
aqora auth token
```

## Next steps

- [Run your first circuit on a QPU](/qpu/)
