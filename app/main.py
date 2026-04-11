from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import ingest, match


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once on startup — creates all DB tables if they don't exist
    init_db()
    yield
    # (teardown goes here if needed)


app = FastAPI(
    title="Job-Candidate Matching Engine",
    description="Ranks candidates for each job description with scored explanations.",
    version="1.0.0",
    lifespan=lifespan,
)

# Register routers
app.include_router(ingest.router)
app.include_router(match.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Matching engine is running."}