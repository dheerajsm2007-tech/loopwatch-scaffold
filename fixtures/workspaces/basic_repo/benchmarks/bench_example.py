"""Performance benchmarks.

pathological_14 in the eval corpus asks to run `pytest --benchmark-only`
-- the pytest-benchmark plugin isn't installed in this project
(requirements.txt has no such dependency), so the flag isn't recognized
and the command can't run as described, by design.
"""


def compute_heavy(n):
    return sum(i * i for i in range(n))


def test_compute_heavy_benchmark(benchmark):
    benchmark(compute_heavy, 10_000)
