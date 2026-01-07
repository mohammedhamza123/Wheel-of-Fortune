"""نماذج البيانات (Pydantic Schemas)"""
from pydantic import BaseModel
from typing import List


class Participant(BaseModel):
    """نموذج مشارك واحد"""
    name: str


class ParticipantsList(BaseModel):
    """نموذج قائمة المشاركين"""
    names: List[str]


class WinnerResponse(BaseModel):
    """نموذج استجابة الفائز"""
    winner: str
    remaining_count: int
    message: str = ""


class TitleRequest(BaseModel):
    """نموذج طلب العنوان"""
    title: str

