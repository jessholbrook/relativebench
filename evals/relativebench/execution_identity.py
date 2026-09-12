"""Execution identity for primary artifacts; hashes are integrity, not attestation."""

from .artifacts import sha256_value
import re


def validate_fingerprint(value):
    if not isinstance(value, dict) or value.get('version') != 'bf16-execution-v1':
        raise ValueError('Primary execution fingerprint is missing or unsupported.')
    if value.get('weight_format') != 'bfloat16' or value.get('attention_implementation') != 'eager':
        raise ValueError('Primary execution precision/attention fingerprint is invalid.')
    if value.get('context_limit') != 32768:
        raise ValueError('Primary execution context must remain 32768.')
    if not isinstance(value.get('adapter_code_sha256'), str) or not re.fullmatch('[0-9a-f]{64}', value['adapter_code_sha256']):
        raise ValueError('Primary adapter implementation hash is missing.')
    for field in ('runtime', 'snapshot', 'environment'):
        if not isinstance(value.get(field), dict) or not value[field]:
            raise ValueError(f'Primary execution fingerprint lacks {field}.')
    for key in ('torch', 'transformers', 'tokenizers', 'safetensors', 'huggingface-hub'):
        if not isinstance(value['runtime'].get(key), str) or not value['runtime'][key]:
            raise ValueError('Primary runtime fingerprint is incomplete.')
    snapshot = value['snapshot']
    if not all(snapshot.get(k) for k in ('repository', 'revision', 'files')):
        raise ValueError('Primary snapshot fingerprint is incomplete.')
    for key in ('python', 'platform', 'cuda', 'driver', 'gpu', 'cublas_workspace_config'):
        if not value['environment'].get(key):
            raise ValueError('Primary host fingerprint is incomplete.')
    return sha256_value(value)


def artifact_fingerprint(artifact):
    metadata = artifact.get('adapter_metadata', {})
    fingerprint = metadata.get('execution_fingerprint')
    digest = validate_fingerprint(fingerprint)
    if metadata.get('execution_fingerprint_sha256') != digest:
        raise ValueError('Primary artifact execution fingerprint hash mismatch.')
    if metadata.get('weight_format') != 'bfloat16':
        raise ValueError('Primary artifact weight format is not BF16.')
    if fingerprint['snapshot']['revision'] != artifact.get('model_revision'):
        raise ValueError('Primary artifact snapshot revision mismatch.')
    return digest
