"""Download a fixed official Silero model into ignored local storage."""
import hashlib
import json
from pathlib import Path
import urllib.request

BASE = Path(__file__).resolve().parent
COMMIT = '066409f3d9db45a30d21dfcbf9147826ffdd7052'
URL = f'https://raw.githubusercontent.com/snakers4/silero-vad/{COMMIT}/src/silero_vad/data/silero_vad.onnx'

if __name__ == '__main__':
    target = BASE / '.local' / 'silero_vad.onnx'
    target.parent.mkdir(exist_ok=True)
    with urllib.request.urlopen(URL, timeout=40) as response:
        data = response.read(10_000_000)
    if not 100_000 < len(data) < 10_000_000:
        raise SystemExit('Unexpected model download size.')
    digest = hashlib.sha256(data).hexdigest()
    target.write_bytes(data)
    metadata = {'source': URL, 'commit': COMMIT, 'sha256': digest, 'bytes': len(data)}
    (BASE / 'model-manifest.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(metadata))
