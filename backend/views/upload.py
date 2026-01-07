"""واجهات رفع الملفات"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from controllers.upload_controller import UploadController

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload-wheel-image")
async def upload_wheel_image(file: UploadFile = File(...)):
    """رفع صورة للعجلة"""
    result = UploadController.upload_wheel_image(file)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return {
        "message": result["message"],
        "url": result["url"]
    }


@router.get("/wheel-image")
async def get_wheel_image():
    """الحصول على رابط صورة العجلة"""
    result = UploadController.get_wheel_image()
    return {"url": result["url"], "exists": result["exists"]}


@router.delete("/wheel-image")
async def delete_wheel_image():
    """حذف صورة العجلة"""
    result = UploadController.delete_wheel_image()
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return {"message": result["message"]}

