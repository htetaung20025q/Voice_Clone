#!/usr/bin/env python3
"""
BurmaVoice Startup Script
Checks environment dependencies, configures runtime, and launches FastAPI server.
"""

import sys
import os
import uvicorn

def main():
    print("=" * 60)
    print("  🚀 Starting BurmaVoice - Myanmar AI Text-to-Speech")
    print("=" * 60)

    # Ensure working directory is project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)
    sys.path.insert(0, project_root)

    from config import HOST, PORT, APP_TITLE, MODEL_ID
    print(f"• Model:   {MODEL_ID}")
    print(f"• Server:  http://{HOST if HOST != '0.0.0.0' else '127.0.0.1'}:{PORT}")
    print("=" * 60)

    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()
