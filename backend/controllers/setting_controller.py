"""متحكم الإعدادات"""
from typing import Dict, Optional
from database.db import get_db_connection


class SettingController:
    """متحكم عمليات الإعدادات"""
    
    @staticmethod
    def get_title() -> Dict:
        """جلب عنوان العجلة"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM settings WHERE key = 'wheel_title'")
        result = cursor.fetchone()
        conn.close()
        
        title = result[0] if result else ""
        return {
            "success": True,
            "title": title,
            "exists": bool(result)
        }
    
    @staticmethod
    def set_title(title: str) -> Dict:
        """حفظ عنوان العجلة"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        title_text = title.strip()
        
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES ('wheel_title', ?, CURRENT_TIMESTAMP)
        """, (title_text,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "تم حفظ العنوان بنجاح",
            "title": title_text
        }
    
    @staticmethod
    def delete_title() -> Dict:
        """حذف عنوان العجلة"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM settings WHERE key = 'wheel_title'")
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "تم حذف العنوان بنجاح"
        }
    
    @staticmethod
    def get_text_color() -> Dict:
        """جلب لون النص"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM settings WHERE key = 'text_color'")
        result = cursor.fetchone()
        conn.close()
        
        color = result[0] if result else "#333333"  # افتراضي داكن للنص
        return {
            "success": True,
            "color": color,
            "exists": bool(result)
        }
    
    @staticmethod
    def set_text_color(color: str) -> Dict:
        """حفظ لون النص"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        color_text = color.strip()
        
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES ('text_color', ?, CURRENT_TIMESTAMP)
        """, (color_text,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "تم حفظ لون النص بنجاح",
            "color": color_text
        }
    
    @staticmethod
    def get_max_display_names() -> Dict:
        """جلب الحد الأقصى للأسماء الظاهرة"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM settings WHERE key = 'max_display_names'")
        result = cursor.fetchone()
        conn.close()
        
        max_names = int(result[0]) if result and result[0].isdigit() else 0  # 0 يعني بدون حد
        return {
            "success": True,
            "max_names": max_names,
            "exists": bool(result)
        }
    
    @staticmethod
    def set_max_display_names(max_names: int) -> Dict:
        """حفظ الحد الأقصى للأسماء الظاهرة"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # التأكد من أن القيمة صحيحة
        max_names_value = max(0, int(max_names))  # على الأقل 0 (بدون حد)
        
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES ('max_display_names', ?, CURRENT_TIMESTAMP)
        """, (str(max_names_value),))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "تم حفظ الحد الأقصى للأسماء بنجاح",
            "max_names": max_names_value
        }
    
    @staticmethod
    def get_sound_muted() -> Dict:
        """جلب حالة كتم الصوت"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT value FROM settings WHERE key = 'sound_muted'")
        result = cursor.fetchone()
        conn.close()
        
        # افتراضي: الصوت غير مكتوم (false)
        is_muted = result[0].lower() == 'true' if result else False
        return {
            "success": True,
            "muted": is_muted,
            "exists": bool(result)
        }
    
    @staticmethod
    def set_sound_muted(muted: bool) -> Dict:
        """حفظ حالة كتم الصوت"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        muted_value = str(muted).lower()
        
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES ('sound_muted', ?, CURRENT_TIMESTAMP)
        """, (muted_value,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "تم حفظ حالة الصوت بنجاح",
            "muted": muted
        }

