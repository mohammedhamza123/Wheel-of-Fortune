@echo off
echo تثبيت المكتبات المطلوبة...
echo.
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo.
echo تم تثبيت المكتبات بنجاح!
pause


