---
title: Key-value store
description: A small dictionary of JSON values kept in one object in your aqora bucket.
---

`aqora.KV` keeps a dictionary of JSON values in a single object in your
[bucket](/storage/). It is meant for small pieces of state that a notebook, a script or a workspace
app wants to remember between runs: counters, settings, the last processed item.

## Quick start

```python
from aqora import KV

kv = KV("state/experiment.json")
kv.set("runs", 3)
kv.set("best", {"accuracy": 0.93, "seed": 7})

print(kv.get("runs"))          # 3
print(kv.list())               # ['best', 'runs']
kv.delete("runs")
kv.flush()                     # wait until everything is written
```

Values can be anything `json.dumps` accepts. `get` returns `None`, or the `default` you pass,
when the key is missing.

The first argument is the object's key in your bucket. Two `KV`s on the same path, whether in one
process or on different machines, share the same dictionary.

## How writes work

`set` and `delete` return immediately. They apply to the local copy at once and a background task
writes the whole document to the bucket, so `get` and `list` see your own changes right away.

The write is conditional on the version of the document that was last read. If someone else wrote
the same document in the meantime, the task fetches the new version, replays your pending changes
on top of it and writes again. Changes are merged per key: two writers setting different keys both
win, and two writers setting the same key end with the later write.

Transient errors are retried with increasing delays. If a batch still fails after several
attempts, the writes stay pending and are retried on the next `set`, `delete` or `flush`.

## How reads work

`get` and `list` combine the last fetched document with your pending writes. The document is
fetched again once the local copy is older than `stale_after` seconds, 5 by default, so changes
made elsewhere show up after at most that long:

```python
kv = KV("state/shared.json", stale_after=1.0)
```

Set it higher for state only you write, or lower to follow other writers more closely. A refetch
only downloads the document when it changed.

## Making sure writes land

`flush()` waits until every pending write is stored and raises a `ClientError` if the background
task gave up on them. `close()` flushes and then refuses further writes. A `with` block closes on
exit:

```python
with KV("state/experiment.json") as kv:
    kv.set("started", True)
```

Writes still pending when the interpreter exits are flushed on a best-effort basis, with a short
timeout, so a plain script does not have to call `flush()` itself. Call it anyway wherever losing
the write would matter, so that an error is reported where it happened.

## Async

`get_async`, `list_async`, `flush_async` and `close_async` await instead of blocking, and
`async with KV(...)` closes on exit. `set` and `delete` never block, so they have no async
variant.

## Choosing the store

By default the `KV` uses a [`Store`](/storage/) built from your login. Pass one to change the
credential lifetime or to act as a viewer of your workspace app:

```python
from aqora import KV, Store, viewer_login

viewer = await viewer_login(["read:storage", "write:storage"])
kv = KV("state/per-viewer.json", Store(viewer))
```

That `KV` lives in the viewer's bucket, not the workspace owner's.
