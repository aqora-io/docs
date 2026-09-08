---
title: Framework backends
description: Native qiskit, pytket, and guppy backends for aqora.
---

The [universal `QPU`](/qpu/) negotiates its wire format with the platform and accepts programs
from any framework. The framework backends on this page each speak one fixed format instead, and
plug into their framework's own tooling — qiskit primitives and transpilation, pytket compilation
passes, guppy's HUGR toolchain. Use them when the rest of your code already lives in one of these
ecosystems.

All three take the same constructor arguments as the universal `QPU`, including
`platform="provider:name"` and `as_entity="my-team"`.

## Qiskit

```bash
uv add "aqora[qiskit]"
```

`aqora.qiskit.QPU` is a qiskit `BackendV2`:

```python
from aqora.qiskit import QPU
from qiskit import QuantumCircuit, transpile

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

backend = QPU(platform="nexus:Selene")
job = backend.run(transpile(qc, backend), shots=1000)
print(job.result().get_counts())
```

Only `shots` is forwarded to the provider; the platform handles device-level compilation.

For the V2 primitives, the backend provides a sampler and an estimator
(`BackendSamplerV2` / `BackendEstimatorV2`):

```python
sampler = backend.sampler()
result = sampler.run([qc], shots=1000).result()
```

## pytket

```bash
uv add "aqora[pytket]"
```

`aqora.pytket.QPU` is a pytket `Backend` with the usual compile-process-retrieve flow:

```python
from aqora.pytket import QPU
from pytket import Circuit

circ = Circuit(2, 2)
circ.H(0).CX(0, 1).measure_all()

backend = QPU(platform="nexus:Selene")
compiled = backend.get_compiled_circuit(circ)
handle = backend.process_circuit(compiled, n_shots=1000)
print(backend.get_result(handle).get_counts())
```

`default_compilation_pass()` runs a client-side optimisation pipeline; the server owns
device-level compilation, so `rebase_pass()` and the backend gateset are client-side conveniences.

## Guppy

```bash
uv add "aqora[guppy]"
```

`aqora.guppy.QPU` submits `@guppy`-decorated functions, hugr `Package`s, or raw HUGR/QIR bytes:

```python
from aqora.guppy import QPU
from guppylang import guppy
from guppylang.std.builtins import result
from guppylang.std.quantum import cx, h, measure, qubit

@guppy
def bell() -> None:
    q0, q1 = qubit(), qubit()
    h(q0)
    cx(q0, q1)
    result("c0", measure(q0))
    result("c1", measure(q1))

qpu = QPU(platform="nexus:Selene")
job = qpu.run(bell, shots=1000)
res = job.result()  # hugr QsysResult (or a labeled QIR result)
print(res.collated_counts())
```
