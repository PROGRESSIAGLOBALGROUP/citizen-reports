import shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
for sub in ["surgery/jobs", "surgery/applied", "surgery/failed"]:
    p = ROOT / sub
    if p.exists():
        for f in p.glob("*"):
            if f.is_file():
                f.unlink()
print("Environment reset: cleared jobs/applied/failed.")
