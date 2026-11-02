"""Plan or run SCKRL-311 fixtures in a fresh, socket-only disposable PostgreSQL cluster.

No application env files or existing database connection options are accepted. Execution requires
--execute after review; default operation only prints the plan. Logs and data are retained for QA.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase/migrations"
FIXTURES = ROOT / "supabase/tests"
PLACEMENT = "20261015100000_sckrl_311_atomic_receipt_placement.sql"
PORT = 55434
CASES = {
    "sckrl311_clean": (None, ["sckrl_311_clean_assert.sql"]),
    "sckrl311_populated": (
        "311",
        ["sckrl_311_legacy_assert.sql", "sckrl_311_placement_commands.sql", "sckrl_311_adversarial.sql"],
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
    if not files or files[-1].name != PLACEMENT:
        raise RuntimeError("Review the runner plan again: the final migration is no longer SCKRL-311.")
    return files


def source_hashes() -> dict[str, str]:
    files = migration_files() + sorted(FIXTURES.glob("*.sql"))
    files += [Path(__file__).resolve(), FIXTURES / "sckrl_311_concurrency.py"]
    return {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in files}


def execute(pg_bin: Path) -> int:
    required = ("initdb", "pg_ctl", "psql", "createdb")
    for name in required:
        if not (pg_bin / name).is_file():
            raise RuntimeError(f"Missing reviewed executable: {pg_bin / name}")
    versions = {
        name: subprocess.check_output([str(pg_bin / name), "--version"], text=True).strip()
        for name in required
    }
    if any(" 14." not in version for version in versions.values()):
        raise RuntimeError("This reviewed runner requires PostgreSQL 14 binaries.")

    work = Path(tempfile.mkdtemp(prefix="sckrl311-validation.", dir="/private/tmp"))
    socket = work / "socket"
    socket.mkdir(mode=0o700)
    data = work / "data"
    # Deliberately omit inherited PG*, DATABASE_URL and Supabase settings, passwords and services.
    env = {
        "PATH": f"{pg_bin}{os.pathsep}{os.defpath}",
        "LC_ALL": "C",
        "PGCONNECT_TIMEOUT": "5",
        "PGOPTIONS": "-c statement_timeout=45000 -c lock_timeout=15000",
    }
    result = {"workDirectory": str(work), "versions": versions, "inputs": source_hashes(), "steps": []}
    result_path = work / "results.json"

    def save() -> None:
        result_path.write_text(json.dumps(result, indent=2) + "\n")

    def run(label: str, command: list[str], timeout: int = 120) -> None:
        index = len(result["steps"]) + 1
        log = work / f"{index:03d}-{label}.log"
        step = {"label": label, "command": command, "log": str(log), "exitCode": None}
        result["steps"].append(step)
        save()
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
            raise

    def connection(database: str) -> list[str]:
        return ["--host", str(socket), "--port", str(PORT), "--username", "postgres", "--dbname", database]

    def sql(database: str, path: Path, migration: bool = False) -> None:
        command = [str(pg_bin / "psql"), "-X", "-w", "-v", "ON_ERROR_STOP=1"] + connection(database)
        if migration:
            command.append("--single-transaction")
        command += ["--file", str(path)]
        run(f"{database}-{path.stem}", command)

    save()
    print(f"Evidence: {work}", flush=True)
    try:
        run("initdb", [str(pg_bin / "initdb"), "--pgdata", str(data), "--username", "postgres",
                        "--auth-local=trust", "--auth-host=reject", "--encoding=UTF8", "--no-locale"])
        options = f"-k {shlex.quote(str(socket))} -p {PORT} -c listen_addresses='' -c unix_socket_permissions=0700"
        run("start", [str(pg_bin / "pg_ctl"), "--pgdata", str(data), "--log", str(work / "server.log"),
                      "--options", options, "--wait", "--timeout", "30", "start"])
        for database, (seed_ticket, assertions) in CASES.items():
            run(f"create-{database}", [str(pg_bin / "createdb"), "--no-password", "--host", str(socket),
                                      "--port", str(PORT), "--username", "postgres", database])
            sql(database, FIXTURES / "local_bootstrap.sql")
            seeded = False
            for migration in migration_files():
                if seed_ticket and f"_sckrl_{seed_ticket}_" in migration.name:
                    sql(database, FIXTURES / f"sckrl_{seed_ticket}_legacy_seed.sql")
                    seeded = True
                sql(database, migration, migration=True)
            if seed_ticket and not seeded:
                raise RuntimeError(f"Missing seed boundary for {database}")
            for fixture in assertions:
                sql(database, FIXTURES / fixture)
        run("sckrl311-concurrency", [sys.executable, str(FIXTURES / "sckrl_311_concurrency.py"),
                                    "--psql-bin", str(pg_bin / "psql")] +
            ["--host", str(socket), "--port", str(PORT), "--user", "postgres",
             "--database", "sckrl311_populated"])
        if source_hashes() != result["inputs"]:
            raise RuntimeError("Source changed during replay; evidence does not bind the final source.")
        result["checksPassed"] = True
    finally:
        result["clusterStopped"] = False
        try:
            if (data / "postmaster.pid").exists():
                run("stop", [str(pg_bin / "pg_ctl"), "--pgdata", str(data), "--mode", "immediate",
                             "--wait", "--timeout", "30", "stop"])
            result["clusterStopped"] = not (data / "postmaster.pid").exists()
        finally:
            save()
            print(f"Evidence retained: {result_path}", flush=True)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pg-bin", type=Path, required=True, help="Reviewed PostgreSQL 14 bin directory")
    parser.add_argument("--execute", action="store_true", help="Execute the separately reviewed disposable plan")
    args = parser.parse_args()
    try:
        if not args.execute:
            print(json.dumps({"cases": CASES, "migrationCount": len(migration_files()),
                              "postgresBin": str(args.pg_bin.resolve()), "inputs": source_hashes()}, indent=2))
            return 0
        return execute(args.pg_bin.resolve())
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"SCKRL-311 replay failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
