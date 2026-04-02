from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.date_range_validation import reject_bad_date_range
from app.database import SessionLocal
from app.service import logs as log_service
from app.schemas import (
    BulkLogCreateRequest,
    LogCreate,
    LogListResponse,
    LogResponse,
    LogUpdate,
    SearchString,
    SourceString,
    Severity,
    SORTABLE_FIELDS,
)

router = APIRouter(prefix="/api/logs", tags=["logs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
def create_log(payload: LogCreate, db: Session = Depends(get_db)):
    return log_service.create_log(db, payload)


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def bulk_create_logs(payload: BulkLogCreateRequest, db: Session = Depends(get_db)):
    inserted = log_service.bulk_create_logs(db, payload.items)
    return {"inserted": inserted}


@router.get("", response_model=LogListResponse)
def get_logs(
    db: Session = Depends(get_db),
    search: SearchString | None = Query(None),
    severity: Severity | None = Query(None),
    source: SourceString | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if sort_by not in SORTABLE_FIELDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"sort_by must be one of: {sorted(SORTABLE_FIELDS)}",
        )
    if sort_order not in ("asc", "desc"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="sort_order must be asc or desc",
        )

    reject_bad_date_range(start_date, end_date)
    items, total = log_service.list_logs(
        db,
        search=search,
        severity=severity,
        source=source,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return LogListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{log_id}", response_model=LogResponse)
def get_log_by_id(log_id: int, db: Session = Depends(get_db)):
    log_entry = log_service.get_log(db, log_id)
    if log_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Log not found"
        )
    return log_entry


@router.put("/{log_id}", response_model=LogResponse)
def update_log(log_id: int, payload: LogUpdate, db: Session = Depends(get_db)):
    updated_log = log_service.update_log(db, log_id, payload)
    if updated_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Log not found"
        )
    return updated_log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: int, db: Session = Depends(get_db)):
    if not log_service.delete_log(db, log_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Log not found"
        )
