"""Protocol weighting and reproducible clustered uncertainty estimates."""

import random
from collections import Counter, defaultdict
from math import ceil, floor

from .metrics import summarize_experience


def _required(record, key):
    if key not in record:
        raise ValueError(f"Judgment is missing required field: {key}")
    return record[key]


def protocol_weighted_judgments(judgments, scenario_counts=None, evaluator_counts=None):
    """Apply equal category/scenario/evaluator weighting from Protocol v0.1."""
    if not judgments:
        raise ValueError("At least one judgment is required.")

    grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for record in judgments:
        category = _required(record, "category")
        scenario_id = _required(record, "scenario_id")
        evaluator_id = _required(record, "evaluator_id")
        _required(record, "rating")
        grouped[category][scenario_id][evaluator_id].append(record)

    categories = sorted(grouped)
    weighted = []
    for category in categories:
        scenarios = grouped[category]
        active_scenarios = {
            scenario_id: count
            for scenario_id in scenarios
            for count in [(scenario_counts or {}).get(scenario_id, 1)]
            if count > 0
        }
        scenario_count_total = sum(active_scenarios.values())
        if scenario_count_total == 0:
            continue
        for scenario_id, scenario_multiplier in active_scenarios.items():
            evaluators = scenarios[scenario_id]
            active_evaluators = {
                evaluator_id: count
                for evaluator_id in evaluators
                for count in [(evaluator_counts or {}).get(evaluator_id, 1)]
                if count > 0
            }
            evaluator_count_total = sum(active_evaluators.values())
            if evaluator_count_total == 0:
                continue
            for evaluator_id, evaluator_multiplier in active_evaluators.items():
                records = evaluators[evaluator_id]
                raw_total = sum(record.get("weight", 1) for record in records)
                if raw_total <= 0:
                    raise ValueError("Judgment weights within an evaluator cluster must sum above zero.")
                for record in records:
                    record_share = record.get("weight", 1) / raw_total
                    weight = (
                        (1 / len(categories))
                        * (scenario_multiplier / scenario_count_total)
                        * (evaluator_multiplier / evaluator_count_total)
                        * record_share
                    )
                    weighted.append({"rating": record["rating"], "weight": weight})
    if not weighted:
        raise ValueError("Cluster resampling produced no judgments.")
    return weighted


def weighted_experience(judgments):
    return summarize_experience(protocol_weighted_judgments(judgments))


def _percentile(sorted_values, probability):
    position = (len(sorted_values) - 1) * probability
    lower = floor(position)
    upper = ceil(position)
    if lower == upper:
        return sorted_values[lower]
    fraction = position - lower
    return sorted_values[lower] * (1 - fraction) + sorted_values[upper] * fraction


def bootstrap_experience(judgments, replicates=10000, seed=20260828, confidence_level=0.95):
    if replicates < 100:
        raise ValueError("At least 100 bootstrap replicates are required.")
    if not 0 < confidence_level < 1:
        raise ValueError("confidence_level must be between zero and one.")

    scenarios_by_category = defaultdict(set)
    evaluator_ids = set()
    for record in judgments:
        scenarios_by_category[_required(record, "category")].add(_required(record, "scenario_id"))
        evaluator_ids.add(_required(record, "evaluator_id"))

    evaluator_ids = sorted(evaluator_ids)
    generator = random.Random(seed)
    estimates = []
    attempts = 0
    maximum_attempts = replicates * 10
    while len(estimates) < replicates and attempts < maximum_attempts:
        attempts += 1
        scenario_counts = Counter()
        for scenario_ids in scenarios_by_category.values():
            ordered = sorted(scenario_ids)
            scenario_counts.update(generator.choices(ordered, k=len(ordered)))
        evaluator_counts = Counter(generator.choices(evaluator_ids, k=len(evaluator_ids)))
        try:
            weighted = protocol_weighted_judgments(
                judgments,
                scenario_counts=scenario_counts,
                evaluator_counts=evaluator_counts,
            )
        except ValueError:
            continue
        estimates.append(summarize_experience(weighted)["experience_delta"])

    if len(estimates) < replicates:
        raise ValueError("Unable to produce enough non-empty cluster bootstrap samples.")

    estimates.sort()
    tail = (1 - confidence_level) / 2
    point = weighted_experience(judgments)
    return {
        **point,
        "confidence_interval": {
            "level": confidence_level,
            "lower": _percentile(estimates, tail),
            "upper": _percentile(estimates, 1 - tail),
        },
        "bootstrap": {
            "method": "two-way-cluster-percentile",
            "replicates": replicates,
            "seed": seed,
            "scenario_clusters": sum(len(items) for items in scenarios_by_category.values()),
            "evaluator_clusters": len(evaluator_ids),
        },
    }
