from datetime import datetime

from fastapi import HTTPException, status

MAX_DATE_RANGE_DAYS = 1825


def reject_bad_date_range(
    start_date: datetime | None, end_date: datetime | None
) -> None:
    if start_date is not None and end_date is not None and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="start_date must not be after end_date",
        )
    if start_date is not None and end_date is not None:
        if (end_date - start_date).days > MAX_DATE_RANGE_DAYS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="date range must be 5 years or fewer",
            )
