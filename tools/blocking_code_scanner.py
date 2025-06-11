import os
import re

BLOCK_PATTERNS = [
    r"time\.sleep\(",
    r"requests\.(get|post|put|delete)\(",
    r"subprocess\.",
    r"while\s+True",
    r"for\s+\w+\s+in\s+iter\(",
    r"threading\.Lock\(",
    r"multiprocessing\.",
    r"asyncio\.sleep\(",
    r"await\s+asyncio\.sleep\(",
]

def scan_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    for i, line in enumerate(lines, 1):
        for pat in BLOCK_PATTERNS:
            if re.search(pat, line):
                print(f"{filepath}:{i}: {line.strip()}")

def scan_dir(root):
    for dirpath, _, files in os.walk(root):
        for file in files:
            if file.endswith(".py"):
                scan_file(os.path.join(dirpath, file))

if __name__ == "__main__":
    scan_dir("webapp/v2/routers/simple_payroll.py")
    scan_dir("webapp/v2/services/simple_payroll/")