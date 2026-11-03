"""Plan or run the SQL fixture suite in a fresh, socket-only disposable PostgreSQL cluster.

Every case replays all migrations in order on its own database. A case with a seed ticket loads
that ticket's legacy seed immediately before the ticket's migration (a populated upgrade) and then
continues through every remaining migration before its assertions run.

No application env files or existing database connection options are accepted. Execution requires
--execute; default operation only prints the plan. Logs, results and source hashes are retained.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase/migrations"
FIXTURES = ROOT / "supabase/tests"
DEFAULT_PORT = 55434
REQUIRED_PG_MAJOR = "14"
CONCURRENCY_DATABASE = "sckrl311_populated"
# database: (seed ticket or None, fixtures run after all migrations)
CASES: dict[str, tuple[str | None, list[str]]] = {
    "sckrl311_clean": (None, ["sckrl_311_clean_assert.sql"]),
    "sckrl311_populated": (
        "311",
        [
            "sckrl_311_legacy_assert.sql",
            "sckrl_311_placement_commands.sql",
            "sckrl_311_adversarial.sql",
            "sckrl_912_error_codes.sql",
        ],
    ),
    "sckrl310_regression": (
        "310",
        ["sckrl_310_legacy_assert.sql", "sckrl_310_review_commands.sql", "sckrl_310_adversarial.sql"],
    ),
    "sckrl406_regression": (
        "406",
        ["sckrl_406_legacy_assert.sql", "sckrl_406_expiry_commands.sql", "sckrl_406_adversarial.sql"],
    ),
    "sckrl312_regression": ("312", ["sckrl_312_legacy_assert.sql", "sckrl_312_receipt_expiry.sql"]),
}


def migration_files() -> list[Path]:
    files = sorted(MIGRATIONS.glob("*.sql"))
    if not files:
        raise RuntimeError(f"No migrations found in {MIGRATIONS}")
    return files


def seed_boundary(ticket: str) -> Path:
    matches = [path for path in migration_files() if f"_sckrl_{ticket}_" in path.name]
    if len(matches) != 1:
        raise RuntimeError(f"Seed ticket {ticket} must match exactly one migration, found {len(matches)}")
    return matches[0]


def validate_cases() -> None:
    for database, (seed_ticket, fixtures) in CASES.items():
        if seed_ticket:
            seed_boundary(seed_ticket)
            if not (FIXTURES / f"sckrl_{seed_ticket}_legacy_seed.sql").is_file():
                raise RuntimeError(f"Missing legacy seed for {database}")
        for fixture in fixtures:
            if not (FIXTURES / fixture).is_file():
                raise RuntimeError(f"Missing fixture {fixture} for {database}")


def source_hashes() -> dict[str, str]:
    files = migration_files() + sorted(FIXTURES.glob("*.sql"))
    files += [Path(__file__).resolve(), FIXTURES / "sckrl_311_concurrency.py"]
    return {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in files}


def plan(pg_bin: Path, concurrency: bool) -> dict[str, object]:
    cases = {}
    for database, (seed_ticket, fixtures) in CASES.items():
        cases[database] = {
            "seedBefore": seed_boundary(seed_ticket).name if seed_ticket else None,
            "seed": f"sckrl_{seed_ticket}_legacy_seed.sql" if seed_ticket else None,
            "fixtures": fixtures,
        }
    return {
        "cases": cases,
        "migrations": [path.name for path in migration_files()],
        "concurrency": CONCURRENCY_DATABASE if concurrency else None,
        "postgresBin": str(pg_bin),
        "inputs": source_hashes(),
    }


def temp_parent() -> str | None:
    # Short parent keeps the Unix socket path under the platform length limit.
    for candidate in ("/private/tmp", "/tmp"):
        if os.path.isdir(candidate):
            return candidate
    return None


def execute(pg_bin: Path, port: int, concurrency: bool, ci: bool, artifacts_dir: Path | None) -> int:
    required = ("initdb", "pg_ctl", "psql", "createdb")
    for name in required:
        if not (pg_bin / name).is_file():
            raise RuntimeError(f"Missing PostgreSQL executable: {pg_bin / name}")
    versions = {
        name: subprocess.check_output([str(pg_bin / name), "--version"], text=True).strip()
        for name in required
    }
    if any(f" {REQUIRED_PG_MAJOR}." not in version for version in versions.values()):
        raise RuntimeError(f"This runner requires PostgreSQL {REQUIRED_PG_MAJOR} binaries: {versions}")
    validate_cases()

    work = Path(tempfile.mkdtemp(prefix="sckrl-sql.", dir=temp_parent()))
    socket = work / "socket"
    socket.mkdir(mode=0o700)
    data = work / "data"
    logs = work / "logs"
    if artifacts_dir:
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        logs = artifacts_dir.resolve()
    logs.mkdir(parents=True, exist_ok=True)
    # Deliberately omit inherited PG*, DATABASE_URL and Supabase settings, passwords and services.
    env = {
        "PATH": f"{pg_bin}{os.pathsep}{os.defpath}",
        "LC_ALL": "C",
        "PGCONNECT_TIMEOUT": "5",
        "PGOPTIONS": "-c statement_timeout=45000 -c lock_timeout=15000",
    }
    result: dict[str, object] = {
        "workDirectory": str(work),
        "logDirectory": str(logs),
        "versions": versions,
        "inputs": source_hashes(),
        "steps": [],
        "checksPassed": False,
    }
    steps: list[dict[str, object]] = result["steps"]  # type: ignore[assignment]
    result_path = logs / "results.json"

    def save() -> None:
        result_path.write_text(json.dumps(result, indent=2) + "\n")

    def run(label: str, command: list[str], timeout: int = 180) -> None:
        index = len(steps) + 1
        log = logs / f"{index:03d}-{label}.log"
        step: dict[str, object] = {"label": label, "command": command, "log": str(log), "exitCode": None}
        steps.append(step)
        save()
        if not ci:
            print(f"{index:03d} {label}", flush=True)
        try:
            with log.open("w") as stream:
                process = subprocess.run(command, env=env, stdout=stream, stderr=subprocess.STDOUT, timeout=timeout)
            step["exitCode"] = process.returncode
            save()
            if process.returncode:
                raise RuntimeError(f"Step {label} failed; inspect {log}")
        except subprocess.TimeoutExpired:
            step["timedOut"] = True
            save()
            raise RuntimeError(f"Step {label} timed out; inspect {log}")

    def connection(database: str) -> list[str]:
        return ["--host", str(socket), "--port", str(port), "--username", "postgres", "--dbname", database]

    def sql(database: str, path: Path, migration: bool = False) -> None:
        command = [str(pg_bin / "psql"), "-X", "-w", "-v", "ON_ERROR_STOP=1"] + connection(database)
        if migration:
            command.append("--single-transaction")
        command += ["--file", str(path)]
        run(f"{database}-{path.stem}", command)

    save()
    print(f"Evidence: {logs}", flush=True)
    failure: str | None = None
    try:
        run("initdb", [str(pg_bin / "initdb"), "--pgdata", str(data), "--username", "postgres",
                        "--auth-local=trust", "--auth-host=reject", "--encoding=UTF8", "--no-locale"])
        options = f"-k {shlex.quote(str(socket))} -p {port} -c listen_addresses='' -c unix_socket_permissions=0700"
        run("start", [str(pg_bin / "pg_ctl"), "--pgdata", str(data), "--log", str(logs / "server.log"),
                      "--options", options, "--wait", "--timeout", "30", "start"])
        for database, (seed_ticket, fixtures) in CASES.items():
            run(f"create-{database}", [str(pg_bin / "createdb"), "--no-password", "--host", str(socket),
                                      "--port", str(port), "--username", "postgres", database])
            sql(database, FIXTURES / "local_bootstrap.sql")
            boundary = seed_boundary(seed_ticket) if seed_ticket else None
            for migration in migration_files():
                if migration == boundary:
                    sql(database, FIXTURES / f"sckrl_{seed_ticket}_legacy_seed.sql")
                sql(database, migration, migration=True)
            for fixture in fixtures:
                sql(database, FIXTURES / fixture)
        if concurrency:
            run("sckrl311-concurrency", [sys.executable, str(FIXTURES / "sckrl_311_concurrency.py"),
                                        "--psql-bin", str(pg_bin / "psql"),
                                        "--host", str(socket), "--port", str(port), "--user", "postgres",
                                        "--database", CONCURRENCY_DATABASE], timeout=600)
        if source_hashes() != result["inputs"]:
            raise RuntimeError("Source changed during replay; evidence does not bind the final source.")
        result["checksPassed"] = True
    except (RuntimeError, OSError, subprocess.SubprocessError) as error:
        failure = str(error)
        result["failure"] = failure
    finally:
        result["clusterStopped"] = False
        try:
            if (data / "postmaster.pid").exists():
                run("stop", [str(pg_bin / "pg_ctl"), "--pgdata", str(data), "--mode", "immediate",
                             "--wait", "--timeout", "30", "stop"])
            result["clusterStopped"] = not (data / "postmaster.pid").exists()
        except RuntimeError as error:
            result["stopFailure"] = str(error)
        finally:
            save()
            if ci and result["clusterStopped"]:
                # Logs live in --artifacts-dir (or work/logs); drop the cluster data and socket.
                shutil.rmtree(data, ignore_errors=True)
                shutil.rmtree(socket, ignore_errors=True)
                if artifacts_dir:
                    shutil.rmtree(work, ignore_errors=True)

    passed = sum(1 for step in steps if step.get("exitCode") == 0)
    ok = bool(result["checksPassed"]) and bool(result["clusterStopped"])
    print(f"PostgreSQL: {versions['psql']}")
    print(f"Cases: {len(CASES)}  Migrations: {len(migration_files())}  "
          f"Concurrency: {'yes' if concurrency else 'skipped'}")
    print(f"Steps passed: {passed}/{len(steps)}  Cluster stopped: {result['clusterStopped']}")
    if failure:
        print(f"FAILED: {failure}", file=sys.stderr)
        log = next((s["log"] for s in reversed(steps) if s.get("exitCode") not in (0,)), None)
        if ci and log and Path(str(log)).is_file():
            tail = Path(str(log)).read_text(errors="replace").splitlines()[-30:]
            print("\n".join(tail), file=sys.stderr)
    print(f"Result: {'PASS' if ok else 'FAIL'}  Evidence: {result_path}", flush=True)
    return 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pg-bin", type=Path, required=True, help="PostgreSQL 14 bin directory")
    parser.add_argument("--execute", action="store_true", help="Create the disposable cluster and run the plan")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Socket port (no TCP listener)")
    parser.add_argument("--skip-concurrency", action="store_true", help="Skip the SCKRL-311 two-session suite")
    parser.add_argument("--ci", action="store_true",
                        help="Concise output, print failing log tail, remove cluster data after shutdown")
    parser.add_argument("--artifacts-dir", type=Path, help="Write logs and results.json here instead of the temp dir")
    args = parser.parse_args()
    try:
        if not args.execute:
            print(json.dumps(plan(args.pg_bin.resolve(), not args.skip_concurrency), indent=2))
            return 0
        return execute(args.pg_bin.resolve(), args.port, not args.skip_concurrency, args.ci, args.artifacts_dir)
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"SQL suite failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
