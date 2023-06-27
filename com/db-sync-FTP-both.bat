@ECHO Off
SETLOCAL
start "" https://nadim.dongee.com:2083/cpsess7273472010/frontend/jupiter/lveversion/nodejs-selector.html.tt#/applications/info.animecream.com
IF EXIST setter.bat (CD.. & CALL com\setter.bat) ELSE ( CALL com\setter.bat )
"keys/WinSCP.com" ^
  /command ^
    "open ftp://%FTPUsername.txt%:%FTPPss.txt%@%FTPserver.txt%" ^
    "option batch off" ^
    "synchronize remote ""%LocalPath.txt%\dist"" /%FTPFolder.txt%" ^
    "put "%LocalPath.txt%\package.json" /package.json" ^
    "exit" ^
IF %ERRORLEVEL% EQU 0 (Echo No error found) ELSE (Echo An error was found)
PAUSE
