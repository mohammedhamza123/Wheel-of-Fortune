"""إعدادات التطبيق"""
from pathlib import Path

# إعدادات قاعدة البيانات
DATABASE = "wheel_of_fortune.db"

# إعدادات مجلد الصور
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# إعدادات CORS
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]

# إعدادات التطبيق
APP_TITLE = "عجلة الحظ"
APP_DESCRIPTION = "نظام عجلة الحظ الاحترافي"

