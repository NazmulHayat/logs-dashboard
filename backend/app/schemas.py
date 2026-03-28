from datetime import date, datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints


class Severity(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


SORTABLE_FIELDS = frozenset({"timestamp", "severity", "source", "created_at", "id"})

SourceString = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)
]
MessageString = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)
]

SearchString = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]


class LogBase(BaseModel):
    timestamp: datetime
    severity: Severity
    source: SourceString
    message: MessageString


class LogCreate(LogBase):
    pass


class LogUpdate(LogBase):
    pass


class LogResponse(LogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LogListResponse(BaseModel):
    items: list[LogResponse]
    total: int
    page: int
    page_size: int


class BulkLogCreateRequest(BaseModel):
    items: list[LogCreate]


class TrendPoint(BaseModel):
    day: date
    count: int


class TrendResponse(BaseModel):
    points: list[TrendPoint]


class SummaryResponse(BaseModel):
    total_logs: int
    error_logs: int
    error_rate: float = Field(
        ...,
        description="Share of ERROR logs in the filtered set, percent 0–100.",
    )
    unique_sources: int


class TopSourceItem(BaseModel):
    source: str
    count: int


class TopSourcesResponse(BaseModel):
    items: list[TopSourceItem]


class SeverityCount(BaseModel):
    severity: str
    count: int


class SeverityDistributionResponse(BaseModel):
    items: list[SeverityCount]
