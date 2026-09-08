---
title: Running circuits on QPUs
description: Submit quantum programs from any framework with aqora's universal QPU.
---

The aqora Python library ships a universal `QPU` that submits quantum programs to a provider
platform on [aqora.io](https://aqora.io) — whatever framework they were written in.

## Quick start

With [qiskit](https://www.ibm.com/quantum/qiskit) installed, run a Bell circuit:

```python
from aqora import QPU
from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

qpu = QPU(platform="nexus:Selene")
job = qpu.run(qc, shots=1000)
print(job.counts())  # [{'00': 512, '11': 488}]
```

`run()` returns immediately with a `QPUJob`; `counts()` waits for the job to complete and
normalizes its results.

## How it works

The framework backends in `aqora.qiskit`, `aqora.pytket` and `aqora.guppy` each speak one fixed
serialization format. The universal `QPU` instead reads the formats the platform accepts (most
preferred first) and encodes into the first of them the submitted programs can produce — so a
qiskit circuit can reach a HUGR-preferring platform, and a guppy program a QASM-preferring one.

When `platform` is omitted the server chooses a default platform, and programs are submitted in
their native format.

## Choosing a platform

`platform` selects the provider platform by name or id. The canonical form is `provider:name`:

```python
qpu = QPU(platform="nexus:Selene")
```

A bare name like `"Selene"` or a global id also works.

## Submitting as a team

Pass `as_entity` to attribute jobs to an organization you belong to. For competitions, that is
your team:

```python
qpu = QPU(platform="nexus:Selene", as_entity="my-team")
```

`as_entity` takes the organization's username or id. Every job submitted through this `QPU` is
attributed to that organization, which is how provider quota is tracked per team.

:::note
Team members must submit as the team. When `as_entity` is omitted the job is attributed to you
personally, and you must be a member of the provider platform yourself.
:::

## What you can submit

`run()` accepts a single program or a list of them:

- qiskit `QuantumCircuit`s
- pytket `Circuit`s
- `@guppy`-decorated functions
- hugr `Package`s
- raw HUGR envelope or QIR bitcode bytes
- QASM source

Every program in a job shares one serialization format: the first the platform accepts that all of
them can produce.

:::note
Cross-framework encoding may need optional extras: `aqora[qiskit-tket]` converts qiskit circuits
to TKET, `aqora[pytket-qir]` pytket circuits to QIR, and `aqora[guppy-qir]` HUGR to QIR. If a
conversion is unavailable, the error tells you which extra to install.
:::

## Working with jobs

```python
job = qpu.run(qc, shots=1000)

job.status()          # "WAITING" | "RUNNING" | "COMPLETED" | ...
job.wait(timeout=60)  # block until completed (raises on failure or timeout)
job.counts()          # one counts dict per program, in submission order
job.result()          # the ProviderResult of a single-program job
job.result_items()    # every ProviderResult of a multi-program job
```

A job can be picked up again later — from another process or machine — by id:

```python
from aqora import QPUJob

job = QPUJob.from_id("...")
print(job.counts())
```

## Reading results

Each result is a `ProviderResult`. `counts()` gives measurement counts normalized across every
result format: keys are bitstrings, and a result carrying several named registers joins their
values with a space in label order, matching qiskit's convention. Counts are always joint over the
registers of a shot, never a product of per-register marginals.

To work with a framework's native result type instead, convert the raw result:

| Converter                 | Returns                        | Requires        |
| ------------------------- | ------------------------------ | --------------- |
| `to_qiskit_result()`      | qiskit `Result`                | `aqora[qiskit]` |
| `to_backend_result()`     | pytket `BackendResult`         | `aqora[pytket]` |
| `to_cirq_result()`        | cirq `Result`                  | `aqora[cirq]`   |
| `to_qsys_result()`        | hugr `QsysResult`              | `aqora[guppy]`  |
| `qsys_shots()`            | raw QSYS shot array            | —               |
| `qir_labeled()`           | labeled QIR result             | —               |
| `cudaq_register_counts()` | per-register counts dict       | —               |

## In aqora workspaces

Workspaces on aqora.io come with `aqora` preinstalled and
[already authenticated](/getting-started/authentication/), so the quick start above runs as-is in
a marimo notebook. Add framework extras to your workspace as needed:

```bash
uv add "aqora[qiskit]"
```
