import hashlib
import json
from pathlib import Path
from urllib.request import urlopen
base=Path(__file__).resolve().parent
manifest=json.loads((base/'model-manifest.json').read_text(encoding='utf-8'))
with urlopen(manifest['source'],timeout=40) as response:data=response.read(10_000_000)
if hashlib.sha256(data).hexdigest()!=manifest['sha256']:raise ValueError('Pinned model checksum mismatch')
target=base/'.models'/'silero_vad.onnx';target.parent.mkdir(exist_ok=True)
target.write_bytes(data)
print('Pinned Silero model verified')
