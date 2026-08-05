"""
StegX AI Recommendation Engine
Heuristic-based analysis for algorithm recommendations, capacity prediction,
quality prediction, and security scoring.
"""
import os
from analyzers.capacity import analyze_capacity, human_readable_size
from analyzers.metadata import inspect_metadata


def _score_algorithm(algorithm: str, cover_type: str, file_size: int,
                     secret_size: int, capacity: int) -> dict:
    """Score an algorithm on multiple dimensions."""
    utilization = (secret_size / capacity * 100) if capacity > 0 else 100

    # Base scores per algorithm
    scores = {
        # Image algorithms
        "lsb": {"security": 40, "quality": 85, "speed": 95, "capacity_rank": 95},
        "dct": {"security": 70, "quality": 75, "speed": 60, "capacity_rank": 50},
        "dwt": {"security": 75, "quality": 80, "speed": 55, "capacity_rank": 60},
        "hybrid": {"security": 80, "quality": 82, "speed": 50, "capacity_rank": 70},
        # Audio algorithms
        "phase_coding": {"security": 65, "quality": 70, "speed": 50, "capacity_rank": 30},
        "echo_hiding": {"security": 60, "quality": 65, "speed": 55, "capacity_rank": 25},
        "spread_spectrum": {"security": 80, "quality": 75, "speed": 45, "capacity_rank": 35},
        # Video algorithms
        "motion_vector": {"security": 70, "quality": 80, "speed": 40, "capacity_rank": 55},
    }

    base = scores.get(algorithm, {"security": 50, "quality": 70, "speed": 70, "capacity_rank": 50})

    # Adjust security based on utilization (lower utilization = harder to detect)
    if utilization < 20:
        base["security"] += 15
    elif utilization < 50:
        base["security"] += 5
    elif utilization > 80:
        base["security"] -= 20

    # Adjust quality based on utilization
    if utilization > 70:
        base["quality"] -= 15
    elif utilization < 30:
        base["quality"] += 5

    # Clamp scores
    for k in base:
        base[k] = max(0, min(100, base[k]))

    base["fits"] = capacity >= secret_size
    base["utilization"] = round(utilization, 1)

    return base


def recommend(cover_file_path: str, cover_type: str,
              secret_size: int = None, secret_file_path: str = None) -> dict:
    """
    Generate AI recommendations for the best steganography approach.

    Returns a comprehensive recommendation with:
    - Best algorithm
    - Capacity predictions for each algorithm
    - Quality predictions
    - Security score
    - Compression recommendation
    """
    # Get cover file metadata
    cover_meta = inspect_metadata(cover_file_path)
    cover_size = cover_meta["size_bytes"]

    # Determine secret size
    if secret_size is None and secret_file_path:
        secret_size = os.path.getsize(secret_file_path)
    elif secret_size is None:
        secret_size = 1024  # Default estimate

    # Determine available algorithms
    if cover_type == "image":
        algorithms = ["lsb", "dct", "dwt", "hybrid"]
    elif cover_type == "audio":
        algorithms = ["lsb", "phase_coding", "echo_hiding", "spread_spectrum"]
    elif cover_type == "video":
        algorithms = ["lsb", "dct", "dwt", "motion_vector", "hybrid"]
    else:
        algorithms = ["lsb"]

    # Analyze each algorithm
    results = {}
    for algo in algorithms:
        try:
            cap = analyze_capacity(cover_file_path, cover_type, algo)
            capacity = cap["max_capacity_bytes"]
            score = _score_algorithm(algo, cover_type, cover_size, secret_size, capacity)
            score["capacity_bytes"] = capacity
            score["capacity_readable"] = human_readable_size(capacity)
            score["estimated_psnr"] = cap.get("estimated_psnr")
            score["estimated_ssim"] = cap.get("estimated_ssim")
            results[algo] = score
        except Exception as e:
            results[algo] = {"error": str(e), "fits": False}

    # Select best algorithm
    best_algo = None
    best_score = -1

    for algo, score in results.items():
        if isinstance(score, dict) and score.get("fits", False):
            # Weighted composite score
            composite = (
                score.get("security", 0) * 0.35 +
                score.get("quality", 0) * 0.30 +
                score.get("speed", 0) * 0.15 +
                score.get("capacity_rank", 0) * 0.20
            )
            if composite > best_score:
                best_score = composite
                best_algo = algo

    # If no algorithm fits, pick the one with most capacity
    if best_algo is None:
        max_cap = 0
        for algo, score in results.items():
            if isinstance(score, dict) and score.get("capacity_bytes", 0) > max_cap:
                max_cap = score["capacity_bytes"]
                best_algo = algo

    if best_algo is None:
        best_algo = algorithms[0]

    # Generate reason
    best_info = results.get(best_algo, {})
    if best_info.get("fits"):
        reason = _generate_reason(best_algo, best_info, cover_type)
    else:
        reason = (f"Warning: The secret data ({human_readable_size(secret_size)}) may not "
                  f"fit in the cover file. Consider using a larger cover file or compressing the data.")

    # Security score
    sec_score = best_info.get("security", 50)
    if secret_size > 0 and best_info.get("capacity_bytes", 0) > 0:
        ratio = secret_size / best_info["capacity_bytes"]
        if ratio < 0.1:
            sec_score = min(100, sec_score + 20)
        elif ratio > 0.5:
            sec_score = max(10, sec_score - 15)

    # Compression recommendation
    if secret_size > 1024 * 1024:  # > 1MB
        compression = "Strongly recommended — compress the secret data before embedding to improve capacity and reduce detection risk."
    elif secret_size > 100 * 1024:  # > 100KB
        compression = "Recommended — compression will increase available capacity."
    else:
        compression = "Optional — the secret data is small enough to embed without compression."

    # Build recommendations list
    recommendations = []
    if best_info.get("utilization", 0) > 50:
        recommendations.append("Consider using a larger cover file to reduce detection risk.")
    if cover_type == "image" and best_algo == "lsb":
        recommendations.append("Use PNG format for output — JPEG compression destroys LSB data.")
    if sec_score < 60:
        recommendations.append("Enable encryption (AES-256 recommended) for additional security.")
    if best_algo in ("dct", "dwt"):
        recommendations.append(f"{best_algo.upper()} provides better robustness against image processing operations.")
    recommendations.append("Always verify extracted data matches the original after embedding.")

    return {
        "best_algorithm": best_algo,
        "algorithm_reason": reason,
        "capacity_prediction": {
            algo: {
                "capacity": score.get("capacity_readable", "N/A"),
                "fits": score.get("fits", False),
                "utilization": f"{score.get('utilization', 0)}%",
            } for algo, score in results.items() if isinstance(score, dict) and "error" not in score
        },
        "quality_prediction": {
            "estimated_psnr": best_info.get("estimated_psnr", 0),
            "estimated_ssim": best_info.get("estimated_ssim", 0),
            "quality_rating": _quality_rating(best_info.get("estimated_psnr")),
        },
        "compression_recommendation": compression,
        "security_score": min(100, max(0, sec_score)),
        "recommendations": recommendations,
        "algorithm_details": results,
    }


def _generate_reason(algo: str, info: dict, cover_type: str) -> str:
    """Generate human-readable reason for algorithm selection."""
    reasons = {
        "lsb": f"LSB provides the highest capacity ({info.get('capacity_readable', 'N/A')}) with fast processing speed. Best for {cover_type} files when maximum data hiding is needed.",
        "dct": f"DCT offers strong robustness against compression with moderate capacity ({info.get('capacity_readable', 'N/A')}). Ideal when the stego file may be processed or compressed.",
        "dwt": f"DWT provides excellent quality preservation (est. PSNR: {info.get('estimated_psnr', 'N/A')} dB) with good capacity ({info.get('capacity_readable', 'N/A')}). Best for high-quality steganography.",
        "hybrid": f"Hybrid combines multiple techniques for balanced security and capacity ({info.get('capacity_readable', 'N/A')}). Recommended for maximum security.",
        "phase_coding": f"Phase coding provides high audio quality with moderate capacity ({info.get('capacity_readable', 'N/A')}). Good for preserving audio fidelity.",
        "echo_hiding": f"Echo hiding is subtle and hard to detect, though capacity is limited ({info.get('capacity_readable', 'N/A')}).",
        "spread_spectrum": f"Spread spectrum offers the highest security for audio steganography with capacity ({info.get('capacity_readable', 'N/A')}). Best for security-critical applications.",
        "motion_vector": f"Motion vector embedding hides data in video motion information. Capacity: {info.get('capacity_readable', 'N/A')}.",
    }
    return reasons.get(algo, f"{algo} selected with capacity {info.get('capacity_readable', 'N/A')}.")


def _quality_rating(psnr: float = None) -> str:
    """Convert PSNR to human-readable quality rating."""
    if psnr is None:
        return "Unknown"
    if psnr > 50:
        return "Excellent — imperceptible changes"
    elif psnr > 40:
        return "Very Good — minimal visual impact"
    elif psnr > 35:
        return "Good — slight visual differences"
    elif psnr > 30:
        return "Fair — noticeable but acceptable"
    else:
        return "Poor — visible degradation"
