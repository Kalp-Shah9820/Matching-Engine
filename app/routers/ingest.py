import uuid
import io
import json

import openpyxl
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import JobDescription, Candidate
from app.models import (
    JobDescriptionIn,
    CandidateIn,
    BulkCandidateIn,
    BulkJDIn,
    JobDescriptionOut,
    CandidateOut,
    UploadResponse,
)

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


# ─── helper ────────────────────────────────────────────────────────────────────

def _safe_bool(value) -> bool | None:
    """Convert truthy Excel cell values to Python bool safely."""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "yes", "1")
    return bool(value)


def _safe_float(value) -> float | None:
    try:
        return float(value) if value is not None else None
    except (ValueError, TypeError):
        return None


def _row_to_candidate(row: dict) -> Candidate:
    """
    Maps a raw dict (from Excel row or JSON payload) → Candidate ORM object.
    Handles missing/null fields gracefully so partial profiles don't crash.
    """
    candidate_id = str(row.get("id") or row.get("candidate_id") or uuid.uuid4())

    return Candidate(
        candidate_id          = candidate_id,
        submission_id         = str(row.get("submission_id") or ""),
        name                  = row.get("name"),
        location              = row.get("location"),
        current_title         = row.get("current_title"),
        years_of_experience   = _safe_float(row.get("years_of_experience")
                                            or row.get("parsed_metadata_calculated_years_experience")),
        education_status      = row.get("education_status"),
        looking_for           = str(row.get("looking_for") or ""),
        current_position      = row.get("current_position"),
        current_company       = row.get("current_company"),
        degree                = row.get("degree"),
        notice_period         = row.get("notice_period"),
        open_to_working_at    = row.get("open_to_working_at"),
        gen_ai_experience     = row.get("gen_ai_experience"),
        expected_salary       = _safe_float(row.get("expected_salary")),
        engineer_type         = row.get("engineer_type"),
        programming_languages = row.get("programming_languages"),
        backend_frameworks    = row.get("backend_frameworks"),
        frontend_technologies = row.get("frontend_technologies"),
        mobile_technologies   = row.get("mobile_technologies"),
        parsed_summary        = row.get("parsed_summary"),
        parsed_skills         = row.get("parsed_skills"),
        parsed_work_experience= row.get("parsed_work_experience"),
        parsed_education      = str(row.get("parsed_metadata_education")
                                    or row.get("parsed_education") or ""),
        is_actively_looking   = _safe_bool(row.get("is_actively_or_passively_looking")
                                           or row.get("is_actively_looking")),
        currently_employed    = _safe_bool(row.get("currently_employed")),
        recent_company_type   = str(row.get("recent_experience_type") or ""),
        recent_company_funded = _safe_bool(row.get("most_recent_company_is_funded")),
        recent_company_size   = row.get("most_recent_company_size"),
    )


# ─── JOB DESCRIPTION endpoints ─────────────────────────────────────────────────

@router.post(
    "/job",
    response_model=JobDescriptionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a single job description",
)
def add_job(payload: JobDescriptionIn, db: Session = Depends(get_db)):
    """
    Add one job description via JSON body.
    Returns the saved JD with its auto-generated jd_id.
    """
    jd = JobDescription(
        jd_id             = str(uuid.uuid4()),
        title             = payload.title,
        company           = payload.company,
        overview          = payload.overview,
        core_requirements = payload.core_requirements,
        preferred_quals   = payload.preferred_quals,
        responsibilities  = payload.responsibilities,
        required_skills   = payload.required_skills,
        employment_type   = payload.employment_type,
        location          = payload.location,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.post(
    "/jobs/bulk",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add multiple job descriptions at once",
)
def add_jobs_bulk(payload: BulkJDIn, db: Session = Depends(get_db)):
    """
    Add multiple JDs in one request.
    Useful for seeding the system with all available roles.
    """
    saved_ids = []
    for item in payload.job_descriptions:
        jd = JobDescription(
            jd_id             = str(uuid.uuid4()),
            title             = item.title,
            company           = item.company,
            overview          = item.overview,
            core_requirements = item.core_requirements,
            preferred_quals   = item.preferred_quals,
            responsibilities  = item.responsibilities,
            required_skills   = item.required_skills,
            employment_type   = item.employment_type,
            location          = item.location,
        )
        db.add(jd)
        saved_ids.append(jd.jd_id)

    db.commit()
    return UploadResponse(
        message=f"{len(saved_ids)} job description(s) saved successfully.",
        count=len(saved_ids),
        ids=saved_ids,
    )


@router.get(
    "/jobs",
    response_model=list[JobDescriptionOut],
    summary="List all job descriptions",
)
def list_jobs(db: Session = Depends(get_db)):
    return db.query(JobDescription).all()


# ─── CANDIDATE endpoints ────────────────────────────────────────────────────────

@router.post(
    "/candidate",
    response_model=CandidateOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a single candidate",
)
def add_candidate(payload: CandidateIn, db: Session = Depends(get_db)):
    """
    Add one candidate via JSON body.
    All fields except candidate_id are optional to handle incomplete profiles.
    """
    row = payload.model_dump()
    candidate = _row_to_candidate(row)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.post(
    "/candidates/bulk",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add multiple candidates via JSON",
)
def add_candidates_bulk(payload: BulkCandidateIn, db: Session = Depends(get_db)):
    """
    Add a list of candidates in one request.
    Skips duplicates (same candidate_id) with a warning rather than crashing.
    """
    saved_ids = []
    skipped = 0

    for item in payload.candidates:
        row = item.model_dump()
        candidate = _row_to_candidate(row)

        existing = db.query(Candidate).filter(
            Candidate.candidate_id == candidate.candidate_id
        ).first()

        if existing:
            skipped += 1
            continue

        db.add(candidate)
        saved_ids.append(candidate.candidate_id)

    db.commit()

    msg = f"{len(saved_ids)} candidate(s) saved."
    if skipped:
        msg += f" {skipped} duplicate(s) skipped."

    return UploadResponse(message=msg, count=len(saved_ids), ids=saved_ids)


@router.post(
    "/candidates/upload-excel",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk upload candidates from Excel (.xlsx)",
)
async def upload_candidates_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload the Sample_Candidate_Data.xlsx directly.
    - Reads all rows from the first sheet.
    - Maps columns to Candidate fields automatically.
    - Skips rows with duplicate candidate IDs.
    - Skips completely empty rows silently.
    """
    # Validate file type
    if not file.filename.endswith((".xlsx", ".xlsm")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx or .xlsm files are accepted.",
        )

    contents = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(contents), read_only=True)
    ws = wb.active

    rows = ws.iter_rows(values_only=True)
    headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(next(rows))]

    saved_ids = []
    skipped_dupes = 0
    skipped_empty = 0

    for raw_row in rows:
        # Skip completely empty rows
        if all(v is None for v in raw_row):
            skipped_empty += 1
            continue

        row = dict(zip(headers, raw_row))
        candidate = _row_to_candidate(row)

        existing = db.query(Candidate).filter(
            Candidate.candidate_id == candidate.candidate_id
        ).first()

        if existing:
            skipped_dupes += 1
            continue

        db.add(candidate)
        saved_ids.append(candidate.candidate_id)

    db.commit()

    msg = f"{len(saved_ids)} candidate(s) imported from Excel."
    if skipped_dupes:
        msg += f" {skipped_dupes} duplicate(s) skipped."
    if skipped_empty:
        msg += f" {skipped_empty} empty row(s) ignored."

    return UploadResponse(message=msg, count=len(saved_ids), ids=saved_ids)


@router.get(
    "/candidates",
    response_model=list[CandidateOut],
    summary="List all candidates (paginated)",
)
def list_candidates(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns candidates with pagination.
    Default: first 50. Use ?skip=50&limit=50 for the next page.
    """
    return db.query(Candidate).offset(skip).limit(limit).all()