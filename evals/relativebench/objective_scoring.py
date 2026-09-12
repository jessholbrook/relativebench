"""Candidate deterministic correctness scoring, separate from perceived preference.

Never executes model code or uses a preference rating as correctness evidence.
The rule registry is bound to exact scenario content and awaits protocol approval.
"""

import argparse
import csv
from decimal import Decimal
import io
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

from .artifacts import sha256_value, write_json

RULES_PATH = Path(__file__).resolve().parents[2] / 'data/pilots/qwen2.5-to-qwen3/objective-rules-0.1.0.json'


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate mapping key.')
        result[key] = value
    return result


def invalid_constant(value):
    raise ValueError('Non-finite JSON number.')


def parse_json(text):
    return json.loads(text, object_pairs_hook=unique_object, parse_float=Decimal,
                      parse_int=Decimal, parse_constant=invalid_constant)


def equal_typed(actual, expected):
    if type(actual) is not type(expected):
        return False
    if isinstance(actual, dict):
        return list(actual) == list(expected) and all(equal_typed(actual[k], expected[k]) for k in expected)
    if isinstance(actual, list):
        return len(actual) == len(expected) and all(equal_typed(a, b) for a, b in zip(actual, expected))
    return actual == expected


def compact_json(text):
    return not any(match.group(1) for match in re.finditer(r'"(?:\\.|[^"\\])*"|(\s)', text))


def record_text(text):
    # Record formats permit LF/CRLF and one final record terminator, not blank
    # records, surrounding spaces, fences, or extracting answers from prose.
    text = text.replace('\r\n', '\n')
    return text[:-1] if text.endswith('\n') else text


def parse_yaml(text):
    import yaml
    class UniqueSafeLoader(yaml.SafeLoader):
        pass
    def mapping(loader, node):
        return unique_object([(loader.construct_object(k), loader.construct_object(v)) for k, v in node.value])
    UniqueSafeLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)
    # This task has a flat mapping. Unsupported YAML features need manual
    # review, not a false failure; never allow arbitrary constructors.
    if any(isinstance(token, (yaml.tokens.AliasToken, yaml.tokens.AnchorToken, yaml.tokens.TagToken, yaml.tokens.DirectiveToken)) for token in yaml.scan(text)):
        raise LookupError('YAML aliases, anchors, tags and directives require manual correctness review.')
    return yaml.load(text, Loader=UniqueSafeLoader)


def matches(rule, text, reference):
    mode = rule['mode']
    if mode == 'exact':
        return text == reference
    if mode == 'number':
        return bool(re.fullmatch(r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?', text)) and Decimal(text) == Decimal(reference)
    if mode == 'integer':
        return bool(re.fullmatch(r'\d+', text)) and int(text) == int(reference)
    if mode == 'comma_tokens':
        return [part.strip(' ') for part in text.split(',')] == [part.strip(' ') for part in reference.split(',')]
    if mode in ('json', 'compact_json'):
        return (mode != 'compact_json' or compact_json(text)) and equal_typed(parse_json(text), parse_json(reference))
    if mode == 'ndjson':
        rows = record_text(text).split('\n')
        expected = reference.split('\n')
        return len(rows) == len(expected) and all(compact_json(a) and equal_typed(parse_json(a), parse_json(b)) for a, b in zip(rows, expected))
    if mode in ('csv', 'csv_minimal'):
        body = record_text(text)
        actual = list(csv.reader(io.StringIO(body, newline=''), strict=True))
        expected = list(csv.reader(io.StringIO(reference, newline=''), strict=True))
        if actual != expected:
            return False
        if mode == 'csv_minimal':
            output = io.StringIO(newline='')
            csv.writer(output, lineterminator='\n').writerows(expected)
            return body == output.getvalue()[:-1]
        return True
    if mode == 'bullets':
        rows = record_text(text).split('\n')
        return len(rows) == 3 and all(re.fullmatch(r' {0,3}[-+*] +'+word, line) for line, word in zip(rows, ('apple', 'banana', 'cherry')))
    if mode == 'markdown_table':
        def cells(line):
            return [v.strip(' ') for v in line.strip(' ').removeprefix('|').removesuffix('|').split('|')]
        rows = [cells(line) for line in record_text(text).split('\n')]
        return len(rows) == 4 and rows[0] == ['Model', 'Score'] and len(rows[1]) == 2 and all(re.fullmatch('-{3,}', cell) for cell in rows[1]) and rows[2:] == [['A', '9'], ['B', '8']]
    if mode in ('xml_result', 'xml_query'):
        if text != text.strip() or '<!DOCTYPE' in text or '<!ENTITY' in text or '<?' in text:
            return False
        root = ET.fromstring(text)
        if len(root) or root.tail:
            return False
        if mode == 'xml_query':
            return text.startswith('<query') and bool(re.search(r'</query\s*>$', text)) and root.tag == 'query' and not root.attrib and root.text == 'a < b & c > d'
        return bool(re.match(r'^<result\s+ok\s*=\s*"[^"]*"\s*>', text)) and bool(re.search(r'</result\s*>$', text)) and root.tag == 'result' and root.attrib == {'ok': 'true'} and root.text == '7'
    if mode == 'yaml':
        return equal_typed(parse_yaml(text), parse_yaml(reference))
    raise LookupError('Unsupported objective rule.')


def score_objective(scenario, text, *, registry=None):
    registry = registry if registry is not None else json.loads(RULES_PATH.read_text())
    base = {'scenario_id': scenario.get('id'), 'rules_version': registry.get('version'),
            'rules_sha256': sha256_value(registry), 'response_sha256': sha256_value({'text': text}),
            'publication_eligible': False}
    rule = registry.get('rules', {}).get(scenario.get('id'))
    if not rule or scenario.get('scoring_mode') != 'objective' or rule.get('scenario_sha256') != sha256_value(scenario):
        return {**base, 'outcome': 'unscorable', 'reason': 'No rule bound to this exact scenario revision.'}
    if not isinstance(text, str):
        return {**base, 'outcome': 'unscorable', 'reason': 'Missing response text.'}
    try:
        passed = matches(rule, text, scenario['reference_answer'])
    except (ImportError, LookupError) as error:
        return {**base, 'outcome': 'unscorable', 'reason': str(error)}
    except (ValueError, ET.ParseError, csv.Error):
        passed = False
    # YAML parser errors are ValueError-independent, and must not crash scoring.
    except Exception as error:
        if type(error).__module__.startswith('yaml'):
            passed = False
        else:
            return {**base, 'outcome': 'unscorable', 'reason': type(error).__name__}
    return {**base, 'outcome': 'pass' if passed else 'fail', 'reason': 'Frozen candidate correctness rule; not a preference judgment.'}


def score_verified_pairs(pilot_path, execution_dir):
    from .manifest import validate_pilot
    from .runner import verify_run
    validation = validate_pilot(pilot_path)
    if not validation['valid']:
        raise ValueError(validation['errors'])
    scenarios = {row['id']: row for row in validation['scenario_manifest']['scenarios']}
    outcomes, commitments = {}, {}
    for role in ('previous', 'new'):
        directory = Path(execution_dir) / role
        report = verify_run(pilot_path, 'frozen-non-thinking-v1', directory, model_roles=(role,))
        if not report['valid'] or not report['complete'] or report['adapters'] != ['transformers-bf16']:
            raise ValueError(f'Correctness scoring requires a complete verified BF16 {role} run.')
        commitments[role] = report['artifact_set_sha256']
        for line in (directory / 'responses.jsonl').read_text().splitlines():
            artifact = json.loads(line)
            outcomes[(artifact['scenario_id'], artifact['seed'], role)] = score_objective(scenarios[artifact['scenario_id']], artifact['response_text'])
    scored, unresolved = [], []
    profile = next(row for row in validation['pilot']['execution_profiles'] if row['id'] == 'frozen-non-thinking-v1')
    for task in sorted(scenarios):
        for seed in profile['seeds']:
            a, b = (outcomes[(task, seed, role)] for role in ('previous', 'new'))
            row = {'scenario_id': task, 'seed': seed, 'previous': a, 'new': b}
            if all(x['outcome'] in ('pass', 'fail') for x in (a, b)):
                scored.append({**row, 'previous_pass': a['outcome'] == 'pass', 'new_pass': b['outcome'] == 'pass'})
            else:
                unresolved.append(row)
    return {'kind': 'candidate_objective_scores', 'source_run_commitments': commitments,
            'scored_pairs': scored, 'unresolved_pairs': unresolved, 'publication_eligible': False,
            'note': 'Rubric and unsupported responses need separately approved correctness review. Do not replace missing outcomes with preference scores.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', default='data/pilots/qwen2.5-to-qwen3/primary-candidate.json')
    parser.add_argument('--execution-dir', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    if Path(args.output).exists():
        parser.error('Choose a new output path; never overwrite scoring evidence.')
    write_json(args.output, score_verified_pairs(args.pilot, args.execution_dir))


if __name__ == '__main__':
    main()
