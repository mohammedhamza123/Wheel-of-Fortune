"""واجهات الفائزين"""
from fastapi import APIRouter, Response
from controllers.winner_controller import WinnerController

router = APIRouter(prefix="/api/winners", tags=["winners"])


@router.get("")
async def get_winners():
    """الحصول على قائمة جميع الفائزين"""
    winners = WinnerController.get_all()
    return {"winners": winners, "count": len(winners)}


@router.delete("")
async def clear_winners():
    """مسح قائمة الفائزين"""
    result = WinnerController.clear_all()
    return {"message": result["message"]}


@router.get("/pdf")
async def download_winners_pdf():
    """تنزيل قائمة الفائزين بصيغة PDF"""
    try:
        pdf_buffer = WinnerController.generate_pdf()
        from datetime import datetime
        filename = f"winners_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return Response(
            content=pdf_buffer.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf; charset=utf-8"
            }
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_detail = f"خطأ في إنشاء PDF: {str(e)}\n\n{error_trace}"
        print("=" * 50)
        print("خطأ في إنشاء PDF:")
        print(error_detail)
        print("=" * 50)
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء PDF: {str(e)}")

