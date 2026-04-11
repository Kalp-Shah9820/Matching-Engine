"""
matcher.py — Hybrid Scoring Engine

Scoring breakdown (weights sum to 1.0):
  - Skill match      45%  →  parsed_skills vs JD required_skills (TF-IDF cosine)
  - Experience fit   25%  →  years_of_experience vs JD minimum years
  - Seniority fit    20%  →  current_title / engineer_type alignment
  - Availability     10%  →  actively looking + notice period

Why hybrid?
  Keyword-only match misses synonyms ("LLM orchestration" ≈ "AI frameworks").
  Pure embeddings are slow and overkill for structured fields like years_of_experience.
  This hybrid gives fast, explainable, tuneable scores.
"""

import re
from dataclasses import dataclass, field
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─── Constants ─────────────────────────────────────────────────────────────────

WEIGHTS = {
    "skill":        0.45,
    "experience":   0.25,
    "seniority":    0.20,
    "availability": 0.10,
}

# Maps JD title keywords → candidate engineer_type values we consider a match
TITLE_SENIORITY_MAP = {
    "ai engineer":       ["AI Engineer", "Machine Learning Engineer", "Backend Engineer"],
    "backend engineer":  ["Backend Engineer", "Full Stack Engineer"],
    "frontend engineer": ["Frontend Engineer", "Full Stack Engineer"],
    "full stack":        ["Full Stack Engineer", "Backend Engineer", "Frontend Engineer"],
    "ml engineer":       ["AI Engineer", "Machine Learning Engineer"],
    "data engineer":     ["Data Engineer", "Backend Engineer"],
}

# Notice period → availability score (higher = more available)
NOTICE_PERIOD_SCORE = {
    "available immediately": 1.0,
    "immediately":           1.0,
    "0 days":                1.0,
    "15 days":               0.85,
    "30 days":               0.70,
    "45 days":               0.55,
    "60 days":               0.40,
    "90 days":               0.20,
    "3 months":              0.20,
    "more than 3 months":    0.05,
}


# ─── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class MatchScore:
    candidate_id:   str
    name:           str
    current_title:  str
    location:       str
    score:          float                    # final weighted score 0.0–1.0
    score_percent:  str                      # "87%"
    rank:           int = 0

    # Sub-scores (useful for explanation + debugging)
    skill_score:        float = 0.0
    experience_score:   float = 0.0
    seniority_score:    float = 0.0
    availability_score: float = 0.0

    # Explanation ingredients
    skills_matched: List[str] = field(default_factory=list)
    skills_missing: List[str] = field(default_factory=list)
    experience_note:  str = ""
    seniority_note:   str = ""
    availability_note:str = ""
    explanation:      str = ""


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _clean_skills(raw: str | None) -> List[str]:
    """
    Split a skills string into a lowercase list.
    Handles comma-separated, newline-separated, and mixed formats.
    Returns empty list for None/empty input (incomplete profiles).
    """
    if not raw:
        return []
    # Remove set-literal syntax from parsed_skills blobs e.g. {"skill1", "skill2"}
    raw = re.sub(r'[{}"•]', '', raw)
    # Split on comma or newline, strip whitespace
    parts = re.split(r'[,\n]+', raw)
    return [p.strip().lower() for p in parts if p.strip()]


def _extract_min_years(jd_text: str | None) -> float:
    """
    Extract the minimum years of experience from JD text.
    Looks for patterns like "2 years", "3+ years", "minimum 2 years", "2-5 years".
    Returns 0.0 if nothing found (no requirement = no penalty).
    """
    if not jd_text:
        return 0.0
    patterns = [
        r'minimum\s+(\d+)\s+years?',
        r'(\d+)\+\s*years?',
        r'(\d+)\s*[-–]\s*\d+\s*years?',
        r'(\d+)\s+years?\s+of\s+experience',
        r'(\d+)\s+years?\s+experience',
    ]
    text = jd_text.lower()
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))
    return 0.0


def _notice_score(notice: str | None) -> float:
    """Map notice period string → 0.0–1.0 score."""
    if not notice:
        return 0.5   # unknown = neutral
    key = notice.strip().lower()
    for k, v in NOTICE_PERIOD_SCORE.items():
        if k in key:
            return v
    return 0.4   # anything unrecognised = below average


# ─── Four scoring functions ────────────────────────────────────────────────────

def score_skills(
    jd_required_skills: str | None,
    jd_full_text: str,
    candidate_parsed_skills: str | None,
    candidate_programming_langs: str | None,
    candidate_backend_frameworks: str | None,
) -> tuple[float, List[str], List[str]]:
    """
    Signal 1 — Skill match (45%)

    Two-layer approach:
      Layer A: TF-IDF cosine similarity between JD text and candidate's
               full skill blob. Captures semantic proximity.
      Layer B: Exact keyword overlap between JD required_skills list and
               candidate skills. Gives explainable matched/missing lists.

    Final = 0.6 * tfidf_score + 0.4 * overlap_score
    """
    # --- Layer A: TF-IDF cosine ---
    candidate_text = " ".join(filter(None, [
        candidate_parsed_skills,
        candidate_programming_langs,
        candidate_backend_frameworks,
    ]))

    if not candidate_text.strip():
        tfidf_score = 0.0
    else:
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
            tfidf_matrix = vectorizer.fit_transform([jd_full_text, candidate_text])
            tfidf_score = float(cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0])
        except Exception:
            tfidf_score = 0.0

    # --- Layer B: exact keyword overlap ---
    jd_skills  = set(_clean_skills(jd_required_skills))
    cand_skills = set(_clean_skills(candidate_parsed_skills)
                      + _clean_skills(candidate_programming_langs)
                      + _clean_skills(candidate_backend_frameworks))

    if not jd_skills:
        overlap_score = tfidf_score   # no JD skills listed → rely on TF-IDF only
        matched = []
        missing = []
    else:
        matched = sorted(jd_skills & cand_skills)
        missing = sorted(jd_skills - cand_skills)
        overlap_score = len(matched) / len(jd_skills)

    final = 0.6 * tfidf_score + 0.4 * overlap_score
    return round(final, 4), matched, missing


def score_experience(
    jd_full_text: str,
    candidate_years: float | None,
) -> tuple[float, str]:
    """
    Signal 2 — Experience fit (25%)

    Compares candidate years against minimum required years extracted from JD text.
    - Meets or exceeds → score 1.0
    - Within 1 year below → score 0.7 (close enough, worth considering)
    - More than 1 year below → linearly decays to 0.0
    - Unknown candidate years → 0.5 (neutral, don't penalise missing data)
    """
    min_years = _extract_min_years(jd_full_text)
    cand_years = candidate_years if candidate_years is not None else -1

    if cand_years < 0:
        return 0.5, "Experience not specified."

    if min_years == 0:
        # JD has no explicit requirement — normalise on a 0–8 year scale
        score = min(cand_years / 8.0, 1.0)
        note = f"No minimum specified. Candidate has {cand_years:.1f} yr(s)."
        return round(score, 4), note

    if cand_years >= min_years:
        note = f"{cand_years:.1f} yr(s) meets the {min_years:.0f}+ yr requirement."
        return 1.0, note

    gap = min_years - cand_years
    if gap <= 1.0:
        score = 0.70
        note = f"{cand_years:.1f} yr(s) is just under the {min_years:.0f} yr minimum (gap: {gap:.1f} yr)."
    else:
        score = max(0.0, 1.0 - (gap / min_years))
        note = f"{cand_years:.1f} yr(s) vs {min_years:.0f} yr minimum — gap of {gap:.1f} yr(s)."

    return round(score, 4), note


def score_seniority(
    jd_title: str,
    candidate_engineer_type: str | None,
    candidate_current_title: str | None,
) -> tuple[float, str]:
    """
    Signal 3 — Seniority / role fit (20%)

    Checks if the candidate's engineer_type and current_title align
    with the JD title. Uses the TITLE_SENIORITY_MAP lookup.
    """
    jd_lower = jd_title.lower()
    cand_type = (candidate_engineer_type or "").strip()
    cand_title = (candidate_current_title or "").strip().lower()

    # Find best matching JD key
    matched_types = []
    for key, valid_types in TITLE_SENIORITY_MAP.items():
        if key in jd_lower:
            matched_types = valid_types
            break

    if not matched_types:
        # No mapping found — fallback to fuzzy title word overlap
        jd_words = set(re.findall(r'\w+', jd_lower))
        cand_words = set(re.findall(r'\w+', cand_title))
        overlap = len(jd_words & cand_words)
        score = min(overlap / max(len(jd_words), 1), 1.0)
        note = f"Role type mapping not found; title word overlap score used."
        return round(score, 4), note

    if cand_type in matched_types:
        score = 1.0
        note = f"Engineer type '{cand_type}' is a strong match for '{jd_title}'."
    elif any(t.lower() in cand_title for t in matched_types):
        score = 0.75
        note = f"Current title '{candidate_current_title}' partially aligns with '{jd_title}'."
    else:
        score = 0.3
        note = f"Engineer type '{cand_type}' is not a typical match for '{jd_title}'."

    return round(score, 4), note


def score_availability(
    is_actively_looking: bool | None,
    notice_period: str | None,
) -> tuple[float, str]:
    """
    Signal 4 — Availability bonus (10%)

    Rewards candidates who are actively looking and available soon.
    This signal never kills a strong match — it's a tiebreaker.
    """
    notice_score = _notice_score(notice_period)
    active_bonus = 1.0 if is_actively_looking else 0.6
    score = 0.5 * active_bonus + 0.5 * notice_score

    looking_str = "actively looking" if is_actively_looking else "passively looking"
    note = f"Candidate is {looking_str}; notice period: {notice_period or 'unknown'}."

    return round(score, 4), note


# ─── Main entry point ──────────────────────────────────────────────────────────

def build_jd_text(jd) -> str:
    """Concatenate all JD text fields into one blob for TF-IDF."""
    return " ".join(filter(None, [
        jd.title,
        jd.overview,
        jd.core_requirements,
        jd.responsibilities,
        jd.required_skills,
        jd.preferred_quals,
    ]))


def rank_candidates(jd, candidates: list) -> List[MatchScore]:
    """
    Core function — scores and ranks all candidates against a single JD.

    Args:
        jd:         JobDescription ORM object
        candidates: list of Candidate ORM objects

    Returns:
        List of MatchScore objects sorted by score descending, rank assigned.
    """
    jd_text = build_jd_text(jd)
    results: List[MatchScore] = []

    for c in candidates:
        # --- Signal 1: Skills ---
        skill_score, matched, missing = score_skills(
            jd_required_skills          = jd.required_skills,
            jd_full_text                = jd_text,
            candidate_parsed_skills     = c.parsed_skills,
            candidate_programming_langs = c.programming_languages,
            candidate_backend_frameworks= c.backend_frameworks,
        )

        # --- Signal 2: Experience ---
        exp_score, exp_note = score_experience(
            jd_full_text   = jd_text,
            candidate_years= c.years_of_experience,
        )

        # --- Signal 3: Seniority ---
        sen_score, sen_note = score_seniority(
            jd_title                  = jd.title,
            candidate_engineer_type   = c.engineer_type,
            candidate_current_title   = c.current_title,
        )

        # --- Signal 4: Availability ---
        avail_score, avail_note = score_availability(
            is_actively_looking = c.is_actively_looking,
            notice_period       = c.notice_period,
        )

        # --- Weighted final score ---
        final_score = (
            WEIGHTS["skill"]        * skill_score +
            WEIGHTS["experience"]   * exp_score   +
            WEIGHTS["seniority"]    * sen_score   +
            WEIGHTS["availability"] * avail_score
        )
        final_score = round(final_score, 4)

        # --- Build human-readable explanation ---
        explanation = _build_explanation(
            candidate_name  = c.name or "Candidate",
            jd_title        = jd.title,
            score           = final_score,
            matched         = matched,
            missing         = missing,
            exp_note        = exp_note,
            sen_note        = sen_note,
            avail_note      = avail_note,
        )

        results.append(MatchScore(
            candidate_id      = c.candidate_id,
            name              = c.name or "Unknown",
            current_title     = c.current_title or "Not specified",
            location          = c.location or "Not specified",
            score             = final_score,
            score_percent     = f"{round(final_score * 100)}%",
            skill_score       = skill_score,
            experience_score  = exp_score,
            seniority_score   = sen_score,
            availability_score= avail_score,
            skills_matched    = matched,
            skills_missing    = missing,
            experience_note   = exp_note,
            seniority_note    = sen_note,
            availability_note = avail_note,
            explanation       = explanation,
        ))

    # Sort by score descending, assign ranks
    results.sort(key=lambda x: x.score, reverse=True)
    for i, r in enumerate(results, start=1):
        r.rank = i

    return results


# ─── Explanation builder ───────────────────────────────────────────────────────

def _build_explanation(
    candidate_name: str,
    jd_title: str,
    score: float,
    matched: List[str],
    missing: List[str],
    exp_note: str,
    sen_note: str,
    avail_note: str,
) -> str:
    """
    Produces a clear, human-readable explanation paragraph.
    Structured so a recruiter can understand ranking without seeing raw data.
    """
    percent = round(score * 100)

    # Skill sentence
    if matched:
        top_matched = ", ".join(matched[:6])
        skill_sentence = f"Matched skills include: {top_matched}."
    else:
        skill_sentence = "No direct skill overlap found with the JD requirements."

    if missing:
        top_missing = ", ".join(missing[:4])
        missing_sentence = f"Skills not found in profile: {top_missing}."
    else:
        missing_sentence = "All key JD skills appear to be present."

    # Overall verdict
    if percent >= 75:
        verdict = "Strong match."
    elif percent >= 55:
        verdict = "Moderate match — worth a closer look."
    elif percent >= 35:
        verdict = "Partial match — some relevant skills but gaps exist."
    else:
        verdict = "Weak match — significant gaps compared to the JD."

    return (
        f"{verdict} "
        f"{skill_sentence} "
        f"{missing_sentence} "
        f"Experience: {exp_note} "
        f"Role alignment: {sen_note} "
        f"Availability: {avail_note}"
    )