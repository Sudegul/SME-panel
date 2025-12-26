from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime


class VisitColorScaleBase(BaseModel):
    """Visit color scale base schema"""
    color: str
    min_visits: int
    max_visits: Optional[int] = None

    @validator('color')
    def validate_color(cls, v):
        allowed_colors = ['yellow', 'orange', 'green']
        if v not in allowed_colors:
            raise ValueError(f'Color must be one of {allowed_colors}')
        return v

    @validator('min_visits')
    def validate_min_visits(cls, v):
        if v < 0:
            raise ValueError('min_visits must be >= 0')
        return v

    @validator('max_visits')
    def validate_max_visits(cls, v, values):
        if v is not None:
            if v < 0:
                raise ValueError('max_visits must be >= 0')
            if 'min_visits' in values and v <= values['min_visits']:
                raise ValueError('max_visits must be greater than min_visits')
        return v


class VisitColorScaleCreate(VisitColorScaleBase):
    """Create visit color scale"""
    pass


class VisitColorScaleUpdate(BaseModel):
    """Update visit color scale"""
    min_visits: int
    max_visits: Optional[int] = None

    @validator('min_visits')
    def validate_min_visits(cls, v):
        if v < 0:
            raise ValueError('min_visits must be >= 0')
        return v

    @validator('max_visits')
    def validate_max_visits(cls, v, values):
        if v is not None:
            if v < 0:
                raise ValueError('max_visits must be >= 0')
            if 'min_visits' in values and v <= values['min_visits']:
                raise ValueError('max_visits must be greater than min_visits')
        return v


class VisitColorScaleResponse(VisitColorScaleBase):
    """Visit color scale response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
