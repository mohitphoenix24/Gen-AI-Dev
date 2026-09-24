"""
Launch the backend and frontend dev servers together.

Kills whatever is already listening on their ports first, so re-running
this after a crash or a leftover process doesn't hit "port already in use".
Ctrl+C stops both cleanly.

Usage:
    venv/bin/python launch.py
"""

import os
import signal
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
VENV_PYTHON = ROOT / "venv" / "bin" / "python"

BACKEND_PORT = 5001
FRONTEND_PORT = 5175  # matches frontend/vite.config.js - 5173 is taken by an unrelated docker-proxy here


def kill_port(port: int) -> None:
    """Kill whatever process is listening on `port`, if anything."""
    result = subprocess.run(
        ["lsof", "-ti", f":{port}"], capture_output=True, text=True
    )
    pids = result.stdout.split()
    for pid in pids:
        subprocess.run(["kill", "-9", pid])
        print(f"  killed pid {pid} on port {port}")


def start(cmd: list[str], cwd: Path) -> subprocess.Popen:
    # start_new_session gives each process its own process group, so
    # stop_all() below can kill a whole tree (e.g. `npm run dev`'s vite
    # child) instead of just the direct child process.
    return subprocess.Popen(cmd, cwd=cwd, start_new_session=True)


def stop(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return  # already exited
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)


def main():
    print("Freeing ports...")
    kill_port(BACKEND_PORT)
    kill_port(FRONTEND_PORT)
    time.sleep(0.5)

    print("Starting backend...")
    backend = start([str(VENV_PYTHON), "server.py"], cwd=ROOT / "ai")

    print("Starting frontend...")
    frontend = start(["npm", "run", "dev"], cwd=ROOT / "frontend")

    print(f"\nBackend:  http://localhost:{BACKEND_PORT}")
    print(f"Frontend: http://localhost:{FRONTEND_PORT}")
    print("\nPress Ctrl+C to stop both.\n")

    try:
        while True:
            time.sleep(1)
            if backend.poll() is not None:
                print("Backend exited unexpectedly - check its output above.")
                break
            if frontend.poll() is not None:
                print("Frontend exited unexpectedly - check its output above.")
                break
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        stop(backend)
        stop(frontend)


if __name__ == "__main__":
    main()
