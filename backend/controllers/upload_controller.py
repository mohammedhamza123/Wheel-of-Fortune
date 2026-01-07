"""متحكم رفع الملفات"""
import shutil
from pathlib import Path
from typing import Dict
from fastapi import UploadFile
from config.config import UPLOAD_DIR


class UploadController:
    """متحكم عمليات رفع الملفات"""
    
    @staticmethod
    def upload_wheel_image(file: UploadFile) -> Dict:
        """رفع صورة للعجلة"""
        try:
            # التحقق من نوع الملف
            if not file.content_type or not file.content_type.startswith('image/'):
                return {
                    "success": False,
                    "message": "يجب أن يكون الملف صورة"
                }
            
            # حفظ الملف
            file_path = UPLOAD_DIR / "wheel_center.png"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            return {
                "success": True,
                "message": "تم رفع الصورة بنجاح",
                "url": "/uploads/wheel_center.png"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"خطأ في رفع الصورة: {str(e)}"
            }
    
    @staticmethod
    def get_wheel_image() -> Dict:
        """الحصول على رابط صورة العجلة"""
        file_path = UPLOAD_DIR / "wheel_center.png"
        if file_path.exists():
            return {
                "success": True,
                "url": "/uploads/wheel_center.png",
                "exists": True
            }
        return {
            "success": True,
            "url": None,
            "exists": False
        }
    
    @staticmethod
    def delete_wheel_image() -> Dict:
        """حذف صورة العجلة"""
        file_path = UPLOAD_DIR / "wheel_center.png"
        if file_path.exists():
            file_path.unlink()
            return {
                "success": True,
                "message": "تم حذف الصورة بنجاح"
            }
        return {
            "success": False,
            "message": "الصورة غير موجودة"
        }

