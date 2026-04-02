from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Log
from app.schemas import Severity, TopSourceItem, TrendPoint


def _apply_filters(
    query,
    *,
    start_date: datetime | None,
    end_date: datetime | None,
    severity: Severity | None,
    source: str | None,
):
    if start_date is not None:
        query = query.where(Log.timestamp >= start_date)
    if end_date is not None:
        query = query.where(Log.timestamp <= end_date)
    if severity is not None:
        query = query.where(Log.severity == severity.value)
    if source is not None:
        query = query.where(Log.source == source)
    return query


def trend_by_day(
    db: Session,
    *,
    start_date: datetime | None,
    end_date: datetime | None,
    severity: Severity | None,
    source: str | None,
) -> list[TrendPoint]:
    day_bucket = func.date_trunc("day", Log.timestamp).label("day")
    trend_query = (
        select(day_bucket, func.count(Log.id)).group_by(day_bucket).order_by(day_bucket)
    )
    trend_query = _apply_filters(
        trend_query,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )

    points: list[TrendPoint] = []
    for result in db.execute(trend_query):
        day_bucket_value = result[0]
        day_value: date = (
            day_bucket_value.date()
            if isinstance(day_bucket_value, datetime)
            else day_bucket_value
        )
        points.append(TrendPoint(day=day_value, count=int(result[1])))
    return points


def summary_stats(
    db: Session,
    *,
    start_date: datetime | None,
    end_date: datetime | None,
    severity: Severity | None,
    source: str | None,
) -> tuple[int, int, int]:
    total_query = select(func.count(Log.id)).select_from(Log)
    total_query = _apply_filters(
        total_query,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )
    total = db.scalar(total_query) or 0

    error_query = (
        select(func.count(Log.id))
        .select_from(Log)
        .where(Log.severity == Severity.ERROR.value)
    )
    error_query = _apply_filters(
        error_query,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )
    error_logs = db.scalar(error_query) or 0

    source_query = select(func.count(func.distinct(Log.source))).select_from(Log)
    source_query = _apply_filters(
        source_query,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )
    unique_sources = db.scalar(source_query) or 0

    return total, error_logs, unique_sources


def severity_distribution(
    db: Session,
    *,
    start_date: datetime | None,
    end_date: datetime | None,
    source: str | None,
) -> list[dict[str, int | str]]:
    query = (
        select(Log.severity, func.count(Log.id))
        .group_by(Log.severity)
        .order_by(Log.severity)
    )
    query = _apply_filters(
        query,
        start_date=start_date,
        end_date=end_date,
        severity=None,
        source=source,
    )

    return [
        {"severity": str(row[0]), "count": int(row[1])}
        for row in db.execute(query)
    ]


def top_sources(
    db: Session,
    *,
    start_date: datetime | None,
    end_date: datetime | None,
    severity: Severity | None,
    source: str | None,
    limit: int,
) -> list[TopSourceItem]:
    cnt = func.count(Log.id)
    query = select(Log.source, cnt).select_from(Log)
    query = _apply_filters(
        query,
        start_date=start_date,
        end_date=end_date,
        severity=severity,
        source=source,
    )
    query = query.group_by(Log.source).order_by(cnt.desc()).limit(limit)
    return [
        TopSourceItem(source=str(row[0]), count=int(row[1]))
        for row in db.execute(query)
    ]
