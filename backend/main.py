"""نقطة دخول التطبيق الرئيسية"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config.config import APP_TITLE, APP_DESCRIPTION, CORS_ORIGINS, UPLOAD_DIR
from database.db import init_db
from views import participants, winners, wheel, settings, upload

# إنشاء تطبيق FastAPI
app = FastAPI(title=APP_TITLE, description=APP_DESCRIPTION)

# إعداد CORS للسماح بالاتصال من الواجهة الأمامية
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ربط مجلد الصور
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# تهيئة قاعدة البيانات عند بدء التطبيق
init_db()

# تسجيل الـ routers
app.include_router(participants.router)
app.include_router(winners.router)
app.include_router(wheel.router)
app.include_router(settings.router)
app.include_router(upload.router)


@app.get("/")
async def root():
    """الصفحة الرئيسية"""
    return {"message": "مرحباً بك في عجلة الحظ!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
