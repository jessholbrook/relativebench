"""Dependency-free reference implementation of the Protocol v0.1 metrics."""

from collections import Counter
from math import isfinite

VALID_RATINGS = {-2, -1, 0, 1, 2}


def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and isfinite(value)


def summarize_experience(judgments):
    """Calculate weighted Experience Delta and its published companions."""
    if not judgments:
        raise ValueError("At least one experience judgment is required.")

    total_weight = 0.0
    weighted_rating = 0.0
    better_weight = 0.0
    worse_weight = 0.0
    noticeable_weight = 0.0
    strong_regression_weight = 0.0
    distribution = Counter({rating: 0 for rating in VALID_RATINGS})
    weighted_distribution = Counter({rating: 0 for rating in VALID_RATINGS})

    for judgment in judgments:
        rating = judgment["rating"]
        weight = judgment.get("weight", 1)
        if not finite_number(rating) or rating not in VALID_RATINGS:
            raise ValueError("Experience ratings must be integers from -2 to 2.")
        if not finite_number(weight) or weight <= 0:
            raise ValueError("Judgment weights must be finite and greater than zero.")

        total_weight += weight
        weighted_rating += weight * rating
        distribution[rating] += 1
        weighted_distribution[rating] += weight
        if rating > 0:
            better_weight += weight
        if rating < 0:
            worse_weight += weight
        if rating != 0:
            noticeable_weight += weight
        if rating == -2:
            strong_regression_weight += weight

    if not isfinite(total_weight) or not isfinite(weighted_rating):
        raise ValueError("Accumulated judgment weights exceed the finite numeric range.")
    return {
        "experience_delta": 50 * (weighted_rating / total_weight),
        "preference_lift": 100 * ((better_weight - worse_weight) / total_weight),
        "noticeability": noticeable_weight / total_weight,
        "strong_regression_rate": strong_regression_weight / total_weight,
        "distribution": {str(rating): distribution[rating] for rating in sorted(VALID_RATINGS)},
        "weighted_distribution": {
            str(rating): weighted_distribution[rating] / total_weight for rating in sorted(VALID_RATINGS)
        },
        "sample_size": len(judgments),
        "total_weight": total_weight,
    }


def summarize_flips(pairs):
    """Return the four-cell compatibility matrix and conditional flip rates."""
    stable_successes = negative_flips = positive_flips = stable_failures = 0
    for pair in pairs:
        previous_passed = pair["previous_passed"]
        new_passed = pair["new_passed"]
        if type(previous_passed) is not bool or type(new_passed) is not bool:
            raise ValueError("Scored pair outcomes must be booleans.")
        if previous_passed and new_passed:
            stable_successes += 1
        elif previous_passed:
            negative_flips += 1
        elif new_passed:
            positive_flips += 1
        else:
            stable_failures += 1

    previous_passes = stable_successes + negative_flips
    previous_failures = positive_flips + stable_failures
    return {
        "stable_successes": stable_successes,
        "negative_flips": negative_flips,
        "positive_flips": positive_flips,
        "stable_failures": stable_failures,
        "negative_flip_rate": None if previous_passes == 0 else negative_flips / previous_passes,
        "positive_flip_rate": None if previous_failures == 0 else positive_flips / previous_failures,
    }


def classify_transition(lower_bound, upper_bound, minimum_important_difference=5):
    """Classify an interval using the preregistered provisional threshold."""
    if not all(finite_number(value) for value in (lower_bound, upper_bound, minimum_important_difference)):
        raise ValueError("Classification bounds and threshold must be finite.")
    if lower_bound < -100 or upper_bound > 100:
        raise ValueError("Experience Delta bounds must lie between -100 and 100.")
    if lower_bound > upper_bound:
        raise ValueError("The lower confidence bound cannot exceed the upper bound.")
    if minimum_important_difference < 0:
        raise ValueError("The minimum important difference cannot be negative.")
    if lower_bound > minimum_important_difference:
        return "upgrade"
    if upper_bound < -minimum_important_difference:
        return "regression"
    if lower_bound >= -minimum_important_difference and upper_bound <= minimum_important_difference:
        return "sidegrade"
    return "inconclusive"
