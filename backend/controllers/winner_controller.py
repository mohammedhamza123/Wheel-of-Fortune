"""متحكم الفائزين"""
from typing import List, Dict
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfdoc
import os
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False
    print("تحذير: مكتبات دعم العربية غير مثبتة. سيتم عرض النص العربي بدون تشكيل.")
from database.db import get_db_connection


class WinnerController:
    """متحكم عمليات الفائزين"""
    
    @staticmethod
    def _reshape_arabic_text(text: str) -> str:
        """تحويل النص العربي لعرضه بشكل صحيح في PDF"""
        if not ARABIC_SUPPORT:
            return text
        try:
            # إعادة تشكيل النص العربي
            reshaped_text = arabic_reshaper.reshape(text)
            # تحويل الاتجاه من اليمين لليسار
            bidi_text = get_display(reshaped_text)
            return bidi_text
        except Exception as e:
            # في حالة الخطأ، إرجاع النص الأصلي
            print(f"تحذير: خطأ في تحويل النص العربي: {e}")
            return text
    
    @staticmethod
    def get_all() -> List[Dict]:
        """الحصول على قائمة جميع الفائزين"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name, won_at FROM winners ORDER BY won_at DESC")
        winners = [{"name": row[0], "won_at": row[1]} for row in cursor.fetchall()]
        conn.close()
        return winners
    
    @staticmethod
    def add(name: str) -> Dict:
        """إضافة فائز"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO winners (name) VALUES (?)", (name,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "تم إضافة الفائز"}
    
    @staticmethod
    def clear_all() -> Dict:
        """مسح قائمة الفائزين"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM winners")
        conn.commit()
        conn.close()
        return {"success": True, "message": "تم مسح قائمة الفائزين"}
    
    @staticmethod
    def generate_pdf() -> BytesIO:
        """إنشاء ملف PDF لقائمة الفائزين"""
        try:
            # الحصول على قائمة الفائزين
            winners = WinnerController.get_all()
            
            # إنشاء buffer للـ PDF
            buffer = BytesIO()
            
            # إنشاء مستند PDF مع اتجاه RTL (من اليمين إلى اليسار)
            # تبديل الهوامش: اليمين يصبح يسار والعكس
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
            
            # إنشاء محتوى المستند
            story = []
            
            # إنشاء الأنماط
            styles = getSampleStyleSheet()
            
            # استخدام خط يدعم Unicode والعربية
            # محاولة استخدام Arial Unicode MS أو خطات أخرى تدعم Unicode
            font_name = 'Helvetica'  # الخط الافتراضي
            
            # محاولة تسجيل خط عربي إذا كان متاحاً
            font_is_custom = False
            try:
                # محاولة استخدام Arial Unicode MS إذا كان متاحاً في النظام
                if os.path.exists('C:/Windows/Fonts/arialuni.ttf'):
                    pdfmetrics.registerFont(TTFont('ArialUnicode', 'C:/Windows/Fonts/arialuni.ttf'))
                    font_name = 'ArialUnicode'
                    font_is_custom = True
                elif os.path.exists('C:/Windows/Fonts/ARIALUNI.TTF'):
                    pdfmetrics.registerFont(TTFont('ArialUnicode', 'C:/Windows/Fonts/ARIALUNI.TTF'))
                    font_name = 'ArialUnicode'
                    font_is_custom = True
            except Exception as e:
                # إذا فشل، نستخدم الخط الافتراضي
                print(f"تحذير: لم يتم العثور على خط Unicode، سيتم استخدام الخط الافتراضي: {e}")
            
            # إنشاء الأنماط مع الخط المناسب
            # إذا كان الخط مخصصاً، نستخدمه مباشرة بدون إضافة -Bold
            # لأن الخطوط المخصصة لا تدعم -Bold تلقائياً
            if font_is_custom:
                title_font = font_name
                heading_font = font_name
            else:
                title_font = 'Helvetica-Bold'
                heading_font = 'Helvetica-Bold'
            
            # أنماط RTL (من اليمين إلى اليسار)
            title_style = ParagraphStyle(
                'ArabicTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#2c3e50'),
                alignment=TA_CENTER,  # العنوان في المنتصف
                fontName=title_font,
                spaceAfter=30,
                direction='rtl'  # اتجاه RTL
            )
            heading_style = ParagraphStyle(
                'ArabicHeading',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor('#34495e'),
                alignment=TA_CENTER,  # العنوان في المنتصف
                fontName=heading_font,
                spaceAfter=20,
                direction='rtl'  # اتجاه RTL
            )
            normal_style = ParagraphStyle(
                'ArabicNormal',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#2c3e50'),
                alignment=TA_RIGHT,  # النص من اليمين
                fontName=font_name,
                spaceAfter=10,
                direction='rtl'  # اتجاه RTL
            )
            
            # العنوان الرئيسي
            title_text = WinnerController._reshape_arabic_text("قائمة الفائزين 🏆")
            title = Paragraph(title_text, title_style)
            story.append(title)
            story.append(Spacer(1, 0.5*cm))
            
            # التاريخ والوقت
            now = datetime.now()
            date_str = now.strftime("%Y-%m-%d %H:%M:%S")
            date_text = WinnerController._reshape_arabic_text(f"تاريخ الطباعة: {date_str}")
            date_para = Paragraph(date_text, normal_style)
            story.append(date_para)
            story.append(Spacer(1, 0.3*cm))
            
            # عدد الفائزين
            count_text = WinnerController._reshape_arabic_text(f"إجمالي عدد الفائزين: {len(winners)}")
            count_para = Paragraph(count_text, heading_style)
            story.append(count_para)
            story.append(Spacer(1, 0.5*cm))
            
            if len(winners) == 0:
                # إذا لم يكن هناك فائزين
                no_winners_text = WinnerController._reshape_arabic_text("لا يوجد فائزون بعد")
                no_winners = Paragraph(no_winners_text, normal_style)
                story.append(no_winners)
            else:
                # إنشاء جدول الفائزين
                # بيانات الجدول
                table_data = []
                
                # رأس الجدول - من اليمين إلى اليسار (RTL)
                # ترتيب الأعمدة: تاريخ الفوز | اسم الفائز | الترتيب
                header = [
                    WinnerController._reshape_arabic_text('تاريخ الفوز'),
                    WinnerController._reshape_arabic_text('اسم الفائز'),
                    WinnerController._reshape_arabic_text('الترتيب')
                ]
                table_data.append(header)
                
                # بيانات الفائزين (مرتبة من الأحدث إلى الأقدم)
                for index, winner in enumerate(winners, 1):
                    # تنسيق التاريخ
                    try:
                        won_date = datetime.fromisoformat(winner['won_at'].replace('Z', '+00:00'))
                        date_formatted = won_date.strftime("%Y-%m-%d %H:%M")
                    except:
                        date_formatted = str(winner['won_at'])
                    
                    # تحويل اسم الفائز العربي
                    winner_name = WinnerController._reshape_arabic_text(winner['name'])
                    
                    # ترتيب الأعمدة من اليمين إلى اليسار: تاريخ | اسم | ترتيب
                    row = [date_formatted, winner_name, str(index)]
                    table_data.append(row)
                
                # إنشاء الجدول - عرض الأعمدة من اليمين إلى اليسار
                table = Table(table_data, colWidths=[5*cm, 8*cm, 2*cm])
                
                # تنسيق الجدول
                table.setStyle(TableStyle([
                    # خلفية رأس الجدول
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), heading_font),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('TOPPADDING', (0, 0), (-1, 0), 12),
                    
                    # تنسيق البيانات
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#2c3e50')),
                    ('FONTNAME', (0, 1), (-1, -1), font_name),
                    ('FONTSIZE', (0, 1), (-1, -1), 11),
                    # محاذاة الأعمدة من اليمين إلى اليسار: تاريخ | اسم | ترتيب
                    ('ALIGN', (0, 1), (0, -1), 'CENTER'),   # عمود التاريخ (أول عمود من اليمين)
                    ('ALIGN', (1, 1), (1, -1), 'RIGHT'),    # عمود الاسم (عربي) - محاذاة يمين
                    ('ALIGN', (2, 1), (2, -1), 'CENTER'),   # عمود الترتيب (آخر عمود من اليسار)
                    
                    # خطوط الجدول
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#95a5a6')),
                    ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2980b9')),
                    
                    # تناوب الألوان للصفوف
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ecf0f1')]),
                    
                    # تباعد
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ]))
                
                story.append(table)
            
            # بناء PDF
            doc.build(story)
            
            # إعادة تعيين buffer للبداية
            buffer.seek(0)
            
            return buffer
        except Exception as e:
            # طباعة الخطأ للمساعدة في التشخيص
            import traceback
            error_msg = f"خطأ في إنشاء PDF: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            raise Exception(error_msg)

