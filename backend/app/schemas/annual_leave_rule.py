from pydantic import BaseModel
from typing import List


class AnnualLeaveRuleBase(BaseModel):
    year_of_service: int
    days_entitled: int


class AnnualLeaveRuleCreate(AnnualLeaveRuleBase):
    pass


class AnnualLeaveRuleUpdate(BaseModel):
    days_entitled: int


class AnnualLeaveRuleResponse(AnnualLeaveRuleBase):
    id: int

    class Config:
        from_attributes = True


class AnnualLeaveRulesBulkUpdate(BaseModel):
    """Toplu güncelleme için"""
    rules: List[AnnualLeaveRuleBase]
