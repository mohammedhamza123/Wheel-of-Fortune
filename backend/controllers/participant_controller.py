"""متحكم المشاركين"""
import sqlite3
from typing import List, Dict
from database.db import get_db_connection


class ParticipantController:
    """متحكم عمليات المشاركين"""
    
    @staticmethod
    def get_all() -> List[str]:
        """الحصول على قائمة جميع المشاركين"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM participants ORDER BY created_at DESC")
        participants = [row[0] for row in cursor.fetchall()]
        conn.close()
        return participants
    
    @staticmethod
    def add(name: str) -> Dict:
        """إضافة مشارك واحد"""
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO participants (name) VALUES (?)", (name.strip(),))
            conn.commit()
            conn.close()
            return {"success": True, "message": "تم إضافة المشارك بنجاح", "name": name}
        except sqlite3.IntegrityError:
            conn.close()
            return {"success": False, "message": "هذا الاسم موجود بالفعل"}
    
    @staticmethod
    def add_bulk(names: List[str]) -> Dict:
        """إضافة عدة مشاركين دفعة واحدة"""
        conn = get_db_connection()
        cursor = conn.cursor()
        added = []
        skipped = []
        
        for name in names:
            name = name.strip()
            if not name:
                continue
            try:
                cursor.execute("INSERT INTO participants (name) VALUES (?)", (name,))
                added.append(name)
            except sqlite3.IntegrityError:
                skipped.append(name)
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"تم إضافة {len(added)} مشارك",
            "added": added,
            "skipped": skipped,
            "added_count": len(added),
            "skipped_count": len(skipped)
        }
    
    @staticmethod
    def remove(name: str) -> Dict:
        """حذف مشارك"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM participants WHERE name = ?", (name,))
        if cursor.rowcount == 0:
            conn.close()
            return {"success": False, "message": "المشارك غير موجود"}
        conn.commit()
        conn.close()
        return {"success": True, "message": "تم حذف المشارك بنجاح"}
    
    @staticmethod
    def clear_all() -> Dict:
        """مسح جميع المشاركين"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM participants")
        conn.commit()
        conn.close()
        return {"success": True, "message": "تم مسح جميع المشاركين"}
    
    @staticmethod
    def count() -> int:
        """عدد المشاركين المتبقين"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM participants")
        count = cursor.fetchone()[0]
        conn.close()
        return count

