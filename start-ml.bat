@echo off
setlocal
cd /d "%~dp0"
start "LGABLEBAND_ML" cmd /k "cd /d ""%~dp0ML"" && python server.py"
start "LGABLEBAND_SOUND_CHATBOT" cmd /k "cd /d ""%~dp0ML\sound_chatbot"" && python server.py"
