"""واجهات الإعدادات"""
from fastapi import APIRouter, HTTPException
from controllers.setting_controller import SettingController

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.post("/title")
async def set_title(title: dict):
    """حفظ عنوان العجلة"""
    title_text = title.get('title', '').strip()
    result = SettingController.set_title(title_text)
    return {"message": result["message"], "title": result["title"]}


@router.get("/title")
async def get_title():
    """جلب عنوان العجلة"""
    result = SettingController.get_title()
    return {"title": result["title"], "exists": result["exists"]}


@router.delete("/title")
async def delete_title():
    """حذف عنوان العجلة"""
    result = SettingController.delete_title()
    return {"message": result["message"]}


@router.post("/text-color")
async def set_text_color(color: dict):
    """حفظ لون النص"""
    color_value = color.get('color', '#ffffff').strip()
    result = SettingController.set_text_color(color_value)
    return {"message": result["message"], "color": result["color"]}


@router.get("/text-color")
async def get_text_color():
    """جلب لون النص"""
    result = SettingController.get_text_color()
    return {"color": result["color"], "exists": result["exists"]}


@router.post("/max-display-names")
async def set_max_display_names(data: dict):
    """حفظ الحد الأقصى للأسماء الظاهرة"""
    max_names = data.get('max_names', 0)
    try:
        max_names = int(max_names)
    except (ValueError, TypeError):
        max_names = 0
    result = SettingController.set_max_display_names(max_names)
    return {"message": result["message"], "max_names": result["max_names"]}


@router.get("/max-display-names")
async def get_max_display_names():
    """جلب الحد الأقصى للأسماء الظاهرة"""
    result = SettingController.get_max_display_names()
    return {"max_names": result["max_names"], "exists": result["exists"]}


@router.get("/sound-muted")
async def get_sound_muted():
    """جلب حالة كتم الصوت"""
    result = SettingController.get_sound_muted()
    return {"muted": result["muted"], "exists": result["exists"]}


@router.post("/sound-muted")
async def set_sound_muted(data: dict):
    """حفظ حالة كتم الصوت"""
    muted = data.get('muted', False)
    try:
        muted = bool(muted)
    except (ValueError, TypeError):
        muted = False
    result = SettingController.set_sound_muted(muted)
    return {"message": result["message"], "muted": result["muted"]}
