"""Compatibility shim: the SCKRL-311 runner is now the generalized `run_sql_suite.py`.

Accepts the same arguments (`--pg-bin`, `--execute`, plus the new options) and stays plan-only by
default.
"""

from __future__ import annotations

from pathlib import Path
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from run_sql_suite import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
