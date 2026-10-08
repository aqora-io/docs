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

Only `shots` is forwarded to the provider, and it is required; the platform handles device-level compilation.

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

### WASM modules

:::note
WASM modules are Nexus-only: they run on the H-series devices, their emulators and syntax checkers
(e.g. `nexus:H2-1E`, `nexus:H2-1SC`). Other platforms reject the job.
:::

Circuits can call into a WASM module mid-circuit, for example to run a custom decoder. Pass the
module's `WasmFileHandler` as `wasm_file_handler`, as you would with pytket-quantinuum:

```python
from aqora.pytket import QPU
from pytket import Circuit
from pytket.wasm import WasmFileHandler

wasm = WasmFileHandler("decoder.wasm")  # pytket requires it to export a no-argument `init`

circ = Circuit(0)
a = circ.add_c_register("a", 8)
b = circ.add_c_register("b", 8)
circ.add_wasm_to_reg("add_one", wasm, [a], [b])

backend = QPU(platform="nexus:H2-1E")
handle = backend.process_circuit(circ, n_shots=10, wasm_file_handler=wasm)
print(backend.get_result(handle).get_counts())
```

The module is uploaded alongside the circuits and attached to the job. A circuit with WASM calls
fails at Nexus when submitted without its module.

### Emulator options

On the same Nexus H-series platforms, `process_circuits` forwards pytket-quantinuum's
`noisy_simulation`, `leakage_detection` and `simplify_initial` keyword arguments to the emulator,
and `options=` takes the other supported fields of Nexus' `QuantinuumConfig`:

```python
backend.process_circuits([circ], n_shots=10, noisy_simulation=False)
backend.process_circuits([circ], n_shots=10, options={"simulator": "stabilizer"})
```

The supported keys are `noisy_simulation`, `simulator`, `error_params`, `compiler_options`,
`no_opt`, `allow_2q_gate_rebase`, `target_2qb_gate`, `leakage_detection` and `simplify_initial`.
Only the options you pass are sent, so Nexus' defaults (such as noisy simulation on the emulators)
apply to the rest. Any other key, or any option on another platform, is rejected before the job is
submitted.

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

### Selene options

`run()` takes `options=` for Nexus' Selene emulators. There are two:

- `nexus:Selene` runs the `SimpleRuntime` with no noise by default. It accepts `n_qubits`,
  `simulator` and `error_model`.
- `nexus:SelenePlus` models the Helios system and runs the `HeliosRuntime` with the
  `QSystemErrorModel` by default. It also accepts `runtime`.

```python
qpu = QPU(platform="nexus:Selene")
job = qpu.run(bell, shots=1000, options={"n_qubits": 2})

qpu = QPU(platform="nexus:SelenePlus")
job = qpu.run(
    bell,
    shots=1000,
    options={"n_qubits": 2, "simulator": {"type": "StabilizerSimulator"}},
)
```

`n_qubits` is the number of qubits to simulate. It defaults to the device's full width (26), and a
statevector simulation of 26 qubits is slow, so set it to what your program needs.

`simulator`, `runtime` and `error_model` are the objects of Nexus' `SeleneConfig` and
`SelenePlusConfig`, written as JSON with a `type` key:

| Option        | `nexus:Selene`                                                                                 | `nexus:SelenePlus`                                              |
| ------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `simulator`   | `StatevectorSimulator`, `StabilizerSimulator`, `CoinflipSimulator`, `ClassicalReplaySimulator` | The same, plus `MatrixProductStateSimulator`                    |
| `runtime`     | Not accepted (always `SimpleRuntime`)                                                          | `SimpleRuntime`, `HeliosRuntime`                                |
| `error_model` | `NoErrorModel`, `DepolarizingErrorModel`                                                       | The same, plus `QSystemErrorModel` and `HeliosCustomErrorModel` |

`QSystemErrorModel` and `HeliosCustomErrorModel` need the `HeliosRuntime`. Nexus checks the
objects' fields, so a job with an invalid one fails at Nexus. Any other key is rejected before the
job is submitted.
