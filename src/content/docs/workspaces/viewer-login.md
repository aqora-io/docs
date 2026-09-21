---
title: Viewer login
description: Let a workspace app act on behalf of the person viewing it.
---

A notebook published as a workspace app on [aqora.io](https://aqora.io) runs as the workspace
owner: `Client()`, `Store()` and `QPU()` inside it use the owner's account. `viewer_login` asks
the person viewing the app to grant it access to *their* account instead, and returns a client
authenticated as them.

## Usage

In a marimo cell:

```python
from aqora import viewer_login

viewer = await viewer_login(["read:user", "read:storage"])
```

The cell renders a **Sign in with aqora** link. The viewer opens it, sees which scopes the app is
asking for, and approves. `viewer_login` waits for that, up to `timeout` seconds (600 by default),
then returns a `Client` acting as the viewer. Use it wherever a client is accepted:

```python
from aqora import KV, QPU, Store

profile = await viewer.send("query { viewer { username } }")
store = Store(viewer)                         # the viewer's bucket
kv = KV("state.json", Store(viewer))          # in the viewer's bucket
qpu = QPU(platform="nexus:Selene", client=viewer)
```

## Scopes

`scope` lists what the app may do as the viewer; the viewer sees the list before approving.
Common scopes are `read:user`, `read:storage`, `write:storage`, `read:dataset`,
`read:competition`, `read:project` and `read:workspace`. When omitted, only the default scope is
requested. The granted scopes are available as `viewer.granted_scopes`.

## Re-running cells

The grant is remembered for the rest of the viewer's session, so re-running the cell, or calling
`viewer_login` again with scopes the grant already covers, returns the same client without
asking again. Each visitor is asked once per session, and grants are never shared between
sessions.

A grant ends when the viewer revokes the app from their account settings, or leaves it unused for
longer than aqora allows. This is noticed once the client's current access token expires: until
then the same client is returned and its requests fail. Reloading the page asks the viewer again
straight away.

## Developing locally

Outside an aqora workspace runner there is no viewer to ask. `viewer_login` then returns a client
for whoever ran [`aqora login`](/getting-started/authentication/) on the machine, with that
account's full access rather than `scope`, and emits a warning saying so. This lets you develop
an app in a local notebook before publishing it; the consent flow itself only runs on aqora.

## Parameters

- `scope`: the scopes to request, as a list of strings.
- `client`: the workspace client to start the authorization from. Defaults to `Client()`.
- `timeout`: seconds to wait for the viewer, 600 by default. Raises `ClientError` when it runs
  out.
- `label`: the text of the sign-in link.
