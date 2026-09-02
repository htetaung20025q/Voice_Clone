#!/usr/bin/env python3
"""
BurmaVoice Full-Stack Launcher
Forwards to start.py to launch both FastAPI backend and Vite frontend.
"""

import os
import sys

def main():
    import start
    start.main()

if __name__ == "__main__":
    main()
