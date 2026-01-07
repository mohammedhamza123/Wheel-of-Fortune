"""واجهات عجلة الحظ"""
from fastapi import APIRouter, HTTPException
from controllers.wheel_controller import WheelController

router = APIRouter(prefix="/api", tags=["wheel"])


@router.post("/spin")
async def spin_wheel():
    """تدوير العجلة واختيار فائز"""
    result = WheelController.spin()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return {
        "winner": result["winner"],
        "remaining_count": result["remaining_count"],
        "message": result["message"]
    }

