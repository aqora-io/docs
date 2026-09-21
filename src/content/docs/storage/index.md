---
title: Object storage
description: Read and write files in your aqora bucket from Python or any S3 client.
---

Every user and organization on [aqora.io](https://aqora.io) has a private bucket on aqora's
object store. The aqora Python library's `Store` mints short-lived S3 credentials for it from
your login, keeps them fresh, and either talks to the bucket directly or hands the credentials to
the S3 client of your choice.

## Quick start

```python
from aqora import Store

store = Store()
store.put("results/run-1.json", b'{"accuracy": 0.93}', content_type="application/json")
print(store.get("results/run-1.json"))  # b'{"accuracy": 0.93}'
store.delete("results/run-1.json")
```

`get` returns the object as bytes, or `None` when there is none. `put` returns the object's ETag.
`delete` succeeds even if the object is already gone.

Keys are paths relative to your bucket, such as `results/run-1.json`. Inside an aqora workspace
the store is ready to use; elsewhere it uses the account from [`aqora login`](/getting-started/authentication/).

:::note
Writing needs the `write:storage` scope. Your own login has it; a client obtained through
[viewer login](/workspaces/viewer-login/) only has it if the viewer granted it.
:::

## Conditional writes

Pass the ETag you read as `if_match` to refuse overwriting a newer version:

```python
from aqora import ClientError

etag = store.put("config.json", b"{}")
try:
    store.put("config.json", b'{"v": 2}', if_match=etag)
except ClientError:
    print("someone else wrote config.json first")
```

For a dictionary that handles this for you, see the [key-value store](/storage/kv/).

## Using S3 libraries

`Store` can configure the common S3 clients so that they re-mint credentials before the current
ones expire. Each needs its optional dependency, installable as an extra of `aqora`.

```python
s3 = store.obstore()          # obstore.store.S3Store, from aqora[obstore]
s3 = store.boto3()            # a boto3 S3 client, from aqora[boto3]
fs = store.s3fs()             # an s3fs.S3FileSystem, from aqora[s3fs]
```

With DuckDB, register a secret on a connection and query the bucket with `s3://` URLs:

```python
import duckdb

con = duckdb.connect()
store.duckdb(con)
con.sql(f"SELECT * FROM 's3://{store.credentials().bucket}/data/*.parquet'")
```

DuckDB comes from `aqora[duckdb]`. Its secrets are static, so pass a longer `duration` to the store for long sessions, or call
`store.duckdb(con)` again once the credentials expire.

## Credentials

`store.credentials()` returns the current credentials, minting new ones when fewer than
`refresh_margin` seconds remain. They are plain SigV4 credentials usable with any S3 client, using
path-style addressing at `{endpoint}/{bucket}/{key}`:

```python
creds = store.credentials()
creds.access_key_id, creds.secret_access_key
creds.endpoint, creds.bucket, creds.region
creds.expires_at        # timezone-aware datetime
creds.remaining()       # seconds until expiry
creds.url("data.csv")   # the object's full URL
```

The constructor takes:

- `duration`: lifetime of minted credentials in seconds, at least 60. The server picks its default
  when omitted and clamps the maximum.
- `refresh_margin`: how many seconds before expiry to mint again. Defaults to 60.
- `client`: an existing `aqora.Client`, for example one returned by
  [`viewer_login`](/workspaces/viewer-login/). Otherwise a client is created from your login.

## Async

Every method that talks to the server has an `_async` twin for code already running on an event
loop: `credentials_async`, `get_async`, `put_async` and `delete_async`. The plain methods are safe
to call from a running loop too, for example in a marimo cell, but block it while they work.

## From the command line

The CLI mints the same credentials for tools outside Python:

```bash
aqora store credentials                      # JSON
aqora store credentials --format env         # export lines for eval
aqora store credentials --format duckdb      # a CREATE SECRET statement
eval "$(aqora store credentials --format env)"
aws s3 ls "s3://$AWS_BUCKET/" --endpoint-url "$AWS_ENDPOINT"
```

To make the AWS CLI and SDKs fetch credentials on demand, add a profile whose
`credential_process` calls aqora:

```bash
aqora store configure-aws                    # writes the "aqora" profile to ~/.aws/config
aws --profile aqora s3 ls "s3://your-username/"
```
