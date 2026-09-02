#!/usr/bin/env python3
"""
Voice Studio Full-Stack Launcher
Starts both the FastAPI backend server and Vite frontend dev server.
"""

import sys
import os
import subprocess
import signal
import time

def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)

    print("=" * 65)
    print("  🎙️  Voice Studio - Gemini TTS Full-Stack Web Application")
    print("=" * 65)
    print("• Backend API:   http://localhost:8000")
    print("• Swagger Docs:  http://localhost:8000/docs")
    print("• Frontend App:  http://localhost:5173")
    print("=" * 65)
    print("Press Ctrl+C at any time to gracefully stop all servers.\n")

    # Determine Python executable in venv or system
    venv_python = os.path.join(project_root, "venv", "bin", "python")
    python_cmd = venv_python if os.path.exists(venv_python) else sys.executable

    processes = []
    try:
        # Start FastAPI backend
        backend_env = os.environ.copy()
        backend_env["PYTHONPATH"] = os.path.join(project_root, "backend")
        
        backend_proc = subprocess.Popen(
            [python_cmd, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=os.path.join(project_root, "backend"),
            env=backend_env
        )
        processes.append(("FastAPI Backend", backend_proc))

        # Start Vite frontend
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev", "--", "--host"],
            cwd=os.path.join(project_root, "frontend")
        )
        processes.append(("Vite Frontend", frontend_proc))

        # Keep parent alive and monitor processes
        while True:
            for name, proc in processes:
                ret = proc.poll()
                if ret is not None:
                    print(f"\n⚠️ Process '{name}' exited unexpectedly with code {ret}.")
                    return
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down Voice Studio processes...")
    finally:
        for name, proc in processes:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                proc.kill()
        print("✓ All processes stopped.")

if __name__ == "__main__":
    main()
