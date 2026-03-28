from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import app.analytics as analytics_service
from app.date_range_validation import reject_bad_date_range
from app.database import SessionLocal
from app.schemas import (
    Severity,
    SeverityDistributionResponse,
    SourceString,
    SummaryResponse,
    TopSourcesResponse,
    TrendResponse,
)

router = APIRouter(prefix="/api/logs/analytics", tags=["analytics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/trend", response_model=TrendResponse)
def get_log_trend(
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    severity: Severity | None = Query(None),
    source: SourceString | None = Query(None),
):
    reject_bad_date_range(start_date, end_date)
    points = analytics_service.trend_by_day(
        db,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )
    return TrendResponse(points=points)


@router.get("/summary", response_model=SummaryResponse)
def get_log_summary(
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    severity: Severity | None = Query(None),
    source: SourceString | None = Query(None),
):
    reject_bad_date_range(start_date, end_date)
    total, errors, sources = analytics_service.summary_stats(
        db,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )
    error_rate = round((errors / total) * 100, 2) if total > 0 else 0.0
    return SummaryResponse(
        total_logs=total,
        error_logs=errors,
        error_rate=error_rate,
        unique_sources=sources,
    )


@router.get("/top-sources", response_model=TopSourcesResponse)
def get_top_sources(
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    severity: Severity | None = Query(None),
    source: SourceString | None = Query(None),
    limit: int = Query(5, ge=1, le=20),
):
    reject_bad_date_range(start_date, end_date)
    items = analytics_service.top_sources(
        db,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
        limit=limit,
    )
    return TopSourcesResponse(items=items)


@router.get("/severity-distribution", response_model=SeverityDistributionResponse)
def get_severity_distribution(
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    source: SourceString | None = Query(None),
):
    reject_bad_date_range(start_date, end_date)
    rows = analytics_service.severity_distribution(
        db,
        start_date=start_date,
        end_date=end_date,
        source=source,
    )
    return SeverityDistributionResponse(items=rows)
