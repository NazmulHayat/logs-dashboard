import logging
from datetime import datetime, timezone

from sqlalchemy import asc, desc, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Log
from app.schemas import LogCreate, LogUpdate, Severity

logger = logging.getLogger(__name__)

SORT_COLUMN_MAP = {
    "timestamp": Log.timestamp,
    "severity": Log.severity,
    "source": Log.source,
    "created_at": Log.created_at,
    "id": Log.id,
}


def _commit_with_rollback(db: Session, *, action: str) -> None:
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error while trying to %s", action)
        raise


def create_log(db: Session, payload: LogCreate) -> Log:
    log_entry = Log(
        timestamp=payload.timestamp,
        severity=payload.severity.value,
        source=payload.source,
        message=payload.message,
    )
    db.add(log_entry)
    _commit_with_rollback(db, action="create log")
    db.refresh(log_entry)
    logger.info("Created log id=%s", log_entry.id)
    return log_entry


def get_log(db: Session, log_id: int) -> Log | None:
    return db.get(Log, log_id)


def update_log(db: Session, log_id: int, payload: LogUpdate) -> Log | None:
    log_entry = db.get(Log, log_id)
    if log_entry is None:
        return None
    log_entry.timestamp = payload.timestamp
    log_entry.severity = payload.severity.value
    log_entry.source = payload.source
    log_entry.message = payload.message
    log_entry.updated_at = datetime.now(timezone.utc)
    _commit_with_rollback(db, action="update log")
    db.refresh(log_entry)
    logger.info("Updated log id=%s", log_id)
    return log_entry


def delete_log(db: Session, log_id: int) -> bool:
    log_entry = db.get(Log, log_id)
    if log_entry is None:
        return False
    db.delete(log_entry)
    _commit_with_rollback(db, action="delete log")
    logger.info("Deleted log id=%s", log_id)
    return True

def list_logs(
    db: Session,
    *,
    search: str | None,
    severity: Severity | None,
    source: str | None,
    start_date: datetime | None,
    end_date: datetime | None,
    sort_by: str,
    sort_order: str,
    page: int,
    page_size: int,
) -> tuple[list[Log], int]:
    query = select(Log)
    total_count_query = select(func.count()).select_from(Log)

    if search:
        clause = Log.message.ilike(f"%{search}%")
        query = query.where(clause)
        total_count_query = total_count_query.where(clause)
    if severity is not None:
        clause = Log.severity == severity.value
        query = query.where(clause)
        total_count_query = total_count_query.where(clause)
    if source is not None:
        clause = Log.source == source
        query = query.where(clause)
        total_count_query = total_count_query.where(clause)
    if start_date is not None:
        clause = Log.timestamp >= start_date
        query = query.where(clause)
        total_count_query = total_count_query.where(clause)
    if end_date is not None:
        clause = Log.timestamp <= end_date
        query = query.where(clause)
        total_count_query = total_count_query.where(clause)

    sort_column = SORT_COLUMN_MAP[sort_by]
    sort_direction = desc if sort_order == "desc" else asc
    query = query.order_by(sort_direction(sort_column))

    total = db.scalar(total_count_query) or 0
    offset = (page - 1) * page_size
    items = list(db.scalars(query.offset(offset).limit(page_size)))
    return items, total


def bulk_create_logs(db: Session, payloads: list[LogCreate]) -> int:
    if not payloads:
        return 0
    logs = [
        Log(
            timestamp=p.timestamp,
            severity=p.severity.value,
            source=p.source,
            message=p.message,
        )
        for p in payloads
    ]
    db.add_all(logs)
    _commit_with_rollback(db, action="bulk create logs")
    logger.info("Bulk created %d logs", len(logs))
    return len(logs)
