"""Explicit opt-in model preparation for a separately approved BF16 host.

Not invoked by tests or CI. Download can be tens of GB per model.
"""

import argparse
import json
from importlib.metadata import version
from pathlib import Path

from .adapters.bf16 import RUNTIME_PACKAGES, verify_snapshot
from .artifacts import sha256_file, write_json
from .readiness import primary_plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', default='data/pilots/qwen2.5-to-qwen3/pilot.json')
    parser.add_argument('--model-role', required=True, choices=('previous', 'new'))
    parser.add_argument('--output', required=True)
    parser.add_argument('--allow-model-download', action='store_true')
    args = parser.parse_args()
    if not args.allow_model_download:
        parser.error('Explicit --allow-model-download is required; no automatic model downloads.')
    directory = Path(args.output)
    if directory.exists():
        parser.error('Choose a new snapshot directory; never overwrite a frozen snapshot.')
    model = primary_plan(args.pilot)['models'][args.model_role]
    runtime = {package: version(package) for package in RUNTIME_PACKAGES}
    from huggingface_hub import snapshot_download
    snapshot_download(model['repository'], revision=model['revision'], local_dir=directory)
    files = {str(path.relative_to(directory)): sha256_file(path) for path in directory.rglob('*')
             if path.is_file() and not str(path.relative_to(directory)).startswith('.cache/')}
    write_json(directory / 'relativebench-snapshot.json',
               {'repository': model['repository'], 'revision': model['revision'], 'weight_format': 'bfloat16', 'files': files})
    verify_snapshot(directory, model)
    write_json(directory.with_suffix('.runtime-lock.json'), runtime)
    print(json.dumps({'prepared': True, 'model_role': args.model_role, 'file_count': len(files),
                      'runtime_lock': str(directory.with_suffix('.runtime-lock.json'))}))


if __name__ == '__main__':
    main()
