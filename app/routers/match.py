"""
match.py — API endpoints for candidate ranking and explanation.

Required endpoints:
  GET /match/{jd_id}                  → ranked list of all candidates
  GET /match/{jd_id}/{candidate_id}   → detailed reasoning for one match
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import JobDescription, Candidate, MatchResult
from app.matcher import rank_candidates
from app.models import MatchSummary, MatchDetail, UploadResponse

router = APIRouter(prefix="/match", tags=["Matching"])


# ─── Helper: run matching and persist results ──────────────────────────────────

def _get_or_run_match(jd_id: str, db: Session, force_rerun: bool = False):
    """
    Checks if match results already exist for this JD.
    If yes and force_rerun=False → returns cached results from DB.
    If no (or force_rerun=True) → runs matching engine, saves results, returns them.

    Why cache? For 100 candidates this is fast. For 100k candidates,
    re-running on every GET request would be too slow — caching is essential.
    """
    jd = db.query(JobDescription).filter(JobDescription.jd_id == jd_id).first()
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description '{jd_id}' not found.",
        )

    # Check cache
    if not force_rerun:
        cached = (
            db.query(MatchResult)
            .filter(MatchResult.jd_id == jd_id)
            .order_by(MatchResult.rank)
            .all()
        )
        if cached:
            return jd, cached, False   # (jd, results, is_fresh)

    # Run matching engine
    candidates = db.query(Candidate).all()
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No candidates found in the database. Upload candidates first.",
        )

    ranked = rank_candidates(jd, candidates)

    # Persist results (delete old ones first if re-running)
    db.query(MatchResult).filter(MatchResult.jd_id == jd_id).delete()

    for match in ranked:
        db.add(MatchResult(
            jd_id        = jd_id,
            candidate_id = match.candidate_id,
            score        = match.score,
            rank         = match.rank,
            explanation  = match.explanation,
        ))

    db.commit()
    return jd, ranked, True   # fresh results


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.get(
    "/{jd_id}",
    response_model=list[MatchSummary],
    summary="Get ranked candidates for a job description",
)
def get_ranked_candidates(
    jd_id: str,
    force_rerun: bool = False,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """
    Returns all candidates ranked for the given JD.

    - Results are cached after the first run. Use `?force_rerun=true` to
      re-score (e.g. after uploading new candidates).
    - Use `?limit=N` to cap results (default: top 20).
    """
    jd, results, is_fresh = _get_or_run_match(jd_id, db, force_rerun)

    # Results may be ORM objects (cached) or MatchScore dataclasses (fresh)
    output = []
    for r in results[:limit]:
        if isinstance(r, MatchResult):
            # Cached — fetch candidate name/title from candidates table
            candidate = db.query(Candidate).filter(
                Candidate.candidate_id == r.candidate_id
            ).first()
            output.append(MatchSummary(
                rank          = r.rank,
                candidate_id  = r.candidate_id,
                name          = candidate.name if candidate else "Unknown",
                current_title = candidate.current_title if candidate else "N/A",
                location      = candidate.location if candidate else "N/A",
                score         = r.score,
                score_percent = f"{round(r.score * 100)}%",
                explanation   = r.explanation,
            ))
        else:
            # Fresh MatchScore dataclass
            output.append(MatchSummary(
                rank          = r.rank,
                candidate_id  = r.candidate_id,
                name          = r.name,
                current_title = r.current_title,
                location      = r.location,
                score         = r.score,
                score_percent = r.score_percent,
                explanation   = r.explanation,
            ))

    return output


@router.get(
    "/{jd_id}/{candidate_id}",
    response_model=MatchDetail,
    summary="Get detailed match reasoning for one candidate",
)
def get_match_detail(
    jd_id: str,
    candidate_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns the full scoring breakdown for one candidate against one JD.

    Includes:
    - Sub-scores for each signal (skill, experience, seniority, availability)
    - Matched and missing skills lists
    - Human-readable explanation paragraph
    """
    jd = db.query(JobDescription).filter(JobDescription.jd_id == jd_id).first()
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description '{jd_id}' not found.",
        )

    candidate = db.query(Candidate).filter(
        Candidate.candidate_id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate '{candidate_id}' not found.",
        )

    # Always re-score for detail view to get fresh sub-scores and skill lists
    from app.matcher import (
        build_jd_text,
        score_skills,
        score_experience,
        score_seniority,
        score_availability,
        _build_explanation,
        WEIGHTS,
    )

    jd_text = build_jd_text(jd)

    skill_score, matched, missing = score_skills(
        jd_required_skills           = jd.required_skills,
        jd_full_text                 = jd_text,
        candidate_parsed_skills      = candidate.parsed_skills,
        candidate_programming_langs  = candidate.programming_languages,
        candidate_backend_frameworks = candidate.backend_frameworks,
    )
    exp_score, exp_note = score_experience(
        jd_full_text    = jd_text,
        candidate_years = candidate.years_of_experience,
    )
    sen_score, sen_note = score_seniority(
        jd_title                 = jd.title,
        candidate_engineer_type  = candidate.engineer_type,
        candidate_current_title  = candidate.current_title,
    )
    avail_score, avail_note = score_availability(
        is_actively_looking = candidate.is_actively_looking,
        notice_period       = candidate.notice_period,
    )

    final_score = round(
        WEIGHTS["skill"]        * skill_score +
        WEIGHTS["experience"]   * exp_score   +
        WEIGHTS["seniority"]    * sen_score   +
        WEIGHTS["availability"] * avail_score,
        4,
    )

    explanation = _build_explanation(
        candidate_name = candidate.name or "Candidate",
        jd_title       = jd.title,
        score          = final_score,
        matched        = matched,
        missing        = missing,
        exp_note       = exp_note,
        sen_note       = sen_note,
        avail_note     = avail_note,
    )

    # Get rank from cached results if available
    cached = db.query(MatchResult).filter(
        MatchResult.jd_id == jd_id,
        MatchResult.candidate_id == candidate_id,
    ).first()
    rank = cached.rank if cached else 0

    return MatchDetail(
        rank                = rank,
        candidate_id        = candidate.candidate_id,
        jd_id               = jd_id,
        name                = candidate.name,
        current_title       = candidate.current_title,
        years_of_experience = candidate.years_of_experience,
        location            = candidate.location,
        score               = final_score,
        score_percent       = f"{round(final_score * 100)}%",
        skills_matched      = matched,
        skills_missing      = missing,
        experience_note     = exp_note,
        education_note      = candidate.parsed_education or "Education info not available.",
        company_context     = _build_company_context(candidate),
        explanation         = explanation,
    )


@router.post(
    "/{jd_id}/run",
    response_model=UploadResponse,
    summary="Trigger matching for a JD and store results",
)
def trigger_matching(jd_id: str, db: Session = Depends(get_db)):
    """
    Explicitly runs the matching engine for a JD and stores ranked results.
    Use this to pre-compute rankings (e.g. after bulk candidate upload).
    Subsequent GET /match/{jd_id} calls will serve from the stored results.
    """
    _, results, _ = _get_or_run_match(jd_id, db, force_rerun=True)
    return UploadResponse(
        message=f"Matching complete. {len(results)} candidates ranked for JD '{jd_id}'.",
        count=len(results),
    )


# ─── Utility ───────────────────────────────────────────────────────────────────

def _build_company_context(candidate) -> str:
    """Build a one-line company context string from candidate company signals."""
    parts = []
    if candidate.recent_company_type:
        parts.append(f"most recent company is a {candidate.recent_company_type.replace('CompanyType.', '').lower()} company")
    if candidate.recent_company_funded:
        parts.append("funded")
    if candidate.recent_company_size:
        parts.append(f"size: {candidate.recent_company_size}")
    if candidate.currently_employed:
        parts.append("currently employed")
    return (
        f"{candidate.current_company or 'Unknown company'} — "
        + (", ".join(parts) if parts else "no additional context")
        + "."
    )