"""متحكم عجلة الحظ"""
import secrets  # استخدام secrets للعشوائية الآمنة بدلاً من random
from typing import Dict
from controllers.participant_controller import ParticipantController
from controllers.winner_controller import WinnerController


class WheelController:
    """متحكم عمليات تدوير العجلة"""
    
    @staticmethod
    def spin() -> Dict:
        """تدوير العجلة واختيار فائز باستخدام عشوائية آمنة"""
        participants = ParticipantController.get_all()
        
        if not participants:
            return {
                "success": False,
                "message": "لا يوجد مشاركون في العجلة"
            }
        
        # اختيار فائز عشوائي آمن (cryptographically secure)
        # مثل wheelofnames.com الذي يستخدم crypto.getRandomValues()
        winner = secrets.choice(participants)
        
        # حذف الفائز من قائمة المشاركين
        ParticipantController.remove(winner)
        
        # إضافة الفائز إلى قائمة الفائزين
        WinnerController.add(winner)
        
        # حساب العدد المتبقي
        remaining_count = ParticipantController.count()
        
        return {
            "success": True,
            "winner": winner,
            "remaining_count": remaining_count,
            "message": f"مبروك! الفائز هو: {winner}"
        }

