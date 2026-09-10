"""Protocol weighting and reproducible clustered uncertainty estimates."""

import random
from collections import Counter, defaultdict
from math import ceil, floor

from .metrics import finite_number, summarize_experience


def _required(record, key):
    if key not in record:
        raise ValueError(f"Judgment is missing required field: {key}")
    return record[key]


def _group_judgments(judgments):
    if not judgments:
        raise ValueError("At least one judgment is required.")
    grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    scenario_categories = {}
    for record in judgments:
        ids = [_required(record, key) for key in ("category", "scenario_id", "evaluator_id")]
        if any(not isinstance(value, str) or not value.strip() for value in ids):
            raise ValueError("Category, scenario, and evaluator IDs must be non-empty strings.")
        category, scenario_id, evaluator_id = ids
        if scenario_id in scenario_categories and scenario_categories[scenario_id] != category:
            raise ValueError("A scenario cannot belong to multiple categories.")
        scenario_categories[scenario_id] = category
        # Validate raw weights before normalization: two negative weights must not
        # divide into apparently legitimate positive shares.
        summarize_experience([{"rating": _required(record, "rating"), "weight": record.get("weight", 1)}])
        grouped[category][scenario_id][evaluator_id].append(record)
    return grouped


def _cluster_count(counts, key):
    if counts is None:
        return 1
    count = counts.get(key, 0)
    if type(count) is not int or count < 0:
        raise ValueError("Cluster multiplicities must be non-negative integers.")
    return count


class EmptyResample(ValueError):
    """A draw has no support in at least one of the fixed categories."""


def protocol_weighted_judgments(judgments, scenario_counts=None, evaluator_counts=None):
    """Apply equal category/scenario/evaluator weighting from Protocol v0.1."""
    return _weighted_groups(_group_judgments(judgments), scenario_counts, evaluator_counts)


def _weighted_groups(grouped, scenario_counts=None, evaluator_counts=None):

    categories = sorted(grouped)
    weighted = []
    for category in categories:
        scenarios = grouped[category]
        active_scenarios = {
            scenario_id: count
            for scenario_id in sorted(scenarios)
            for count in [_cluster_count(scenario_counts, scenario_id)]
            if count > 0 and any(_cluster_count(evaluator_counts, key) > 0 for key in scenarios[scenario_id])
        }
        scenario_count_total = sum(active_scenarios.values())
        if scenario_count_total == 0:
            raise EmptyResample("Cluster resampling removed all judgments in a category.")
        for scenario_id, scenario_multiplier in active_scenarios.items():
            evaluators = scenarios[scenario_id]
            active_evaluators = {
                evaluator_id: count
                for evaluator_id in sorted(evaluators)
                for count in [_cluster_count(evaluator_counts, evaluator_id)]
                if count > 0
            }
            evaluator_count_total = sum(active_evaluators.values())
            if evaluator_count_total == 0:
                continue
            for evaluator_id, evaluator_multiplier in active_evaluators.items():
                records = evaluators[evaluator_id]
                raw_total = sum(record.get("weight", 1) for record in records)
                if not finite_number(raw_total) or raw_total <= 0:
                    raise ValueError("Judgment weights within an evaluator cluster must have a finite positive sum.")
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
    if type(replicates) is not int or replicates < 100:
        raise ValueError("At least 100 bootstrap replicates are required.")
    if not finite_number(confidence_level) or not 0 < confidence_level < 1:
        raise ValueError("confidence_level must be between zero and one.")

    grouped = _group_judgments(judgments)
    point = summarize_experience(_weighted_groups(grouped))

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
        for category in sorted(scenarios_by_category):
            scenario_ids = scenarios_by_category[category]
            ordered = sorted(scenario_ids)
            scenario_counts.update(generator.choices(ordered, k=len(ordered)))
        evaluator_counts = Counter(generator.choices(evaluator_ids, k=len(evaluator_ids)))
        try:
            weighted = _weighted_groups(
                grouped,
                scenario_counts=scenario_counts,
                evaluator_counts=evaluator_counts,
            )
        except EmptyResample:
            continue
        estimates.append(summarize_experience(weighted)["experience_delta"])

    if len(estimates) < replicates:
        raise ValueError("Unable to produce enough non-empty cluster bootstrap samples.")

    estimates.sort()
    tail = (1 - confidence_level) / 2
    warnings = []
    if replicates < 10000:
        warnings.append("Fewer than the protocol's 10,000 replicates; software check only.")
    if any(len(items) < 2 for items in scenarios_by_category.values()) or len(evaluator_ids) < 2:
        warnings.append("Too few independent clusters to assess variation on every inference dimension.")
    if attempts > replicates:
        warnings.append("Empty-category draws rejected; interval is conditional on category support. Validate sparse-design coverage before use.")
    if estimates[0] == estimates[-1]:
        warnings.append("Degenerate bootstrap distribution does not demonstrate certainty.")
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
            "attempts": attempts,
            "rejected_draws": attempts - replicates,
            "implementation_version": "0.1.1",
        },
        "warnings": warnings,
    }
