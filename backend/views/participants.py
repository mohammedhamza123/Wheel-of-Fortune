"""واجهات المشاركين"""
from fastapi import APIRouter, HTTPException
from models.schemas import Participant, ParticipantsList
from controllers.participant_controller import ParticipantController

router = APIRouter(prefix="/api/participants", tags=["participants"])


@router.get("")
async def get_participants():
    """الحصول على قائمة جميع المشاركين"""
    participants = ParticipantController.get_all()
    return {"participants": participants, "count": len(participants)}


@router.post("")
async def add_participant(participant: Participant):
    """إضافة مشارك واحد"""
    result = ParticipantController.add(participant.name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return {"message": result["message"], "name": result["name"]}


@router.post("/bulk")
async def add_participants_bulk(participants: ParticipantsList):
    """إضافة عدة مشاركين دفعة واحدة"""
    result = ParticipantController.add_bulk(participants.names)
    return {
        "message": result["message"],
        "added": result["added"],
        "skipped": result["skipped"],
        "added_count": result["added_count"],
        "skipped_count": result["skipped_count"]
    }


@router.delete("/{name}")
async def remove_participant(name: str):
    """حذف مشارك"""
    result = ParticipantController.remove(name)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return {"message": result["message"]}


@router.delete("")
async def clear_participants():
    """مسح جميع المشاركين"""
    result = ParticipantController.clear_all()
    return {"message": result["message"]}

