---
title: Installation
description: Install the aqora CLI and Python library with uv.
---

The aqora CLI ships on PyPI as [`aqora`](https://pypi.org/project/aqora/) and bundles both the
`aqora` command and the aqora Python library. It requires Python 3.10 or greater.

We recommend installing it with [uv](https://docs.astral.sh/uv/). If you don't already have `uv`,
follow its [installation instructions](https://docs.astral.sh/uv/getting-started/installation/).
Then install the CLI as a tool:

```bash
uv tool install aqora
```

This makes the `aqora` command available globally. To upgrade later, run:

```bash
uv tool upgrade aqora
```

## Verify the installation

The following should output helpful information:

```bash
aqora help
```

:::note[Notes for Windows users]
If `uv` warns that the script directory is not on your `PATH`, copy the directory from the warning
and [add it to your `PATH`](https://www.java.com/en/download/help/path.html).

You may also need the latest Visual C++ Redistributable — you can find
[the latest version here](https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist?view=msvc-170#latest-microsoft-visual-c-redistributable-version).
:::

## Next steps

- [Log in to your aqora account](/getting-started/authentication/)
- [Run your first circuit on a QPU](/qpu/)
