@ECHO OFF
SETLOCAL
IF EXIST setter.bat (CD.. & CALL com\setter.bat) ELSE ( CALL com\setter.bat )
start "" %Link_restart_node.txt%
"keys/WinSCP.com" ^
  /command ^
    "open ftp://%FTPUsername.txt%:%FTPPss.txt%@%FTPserver.txt%" ^
    "option batch off" ^
    "synchronize remote  ""%LocalPath.txt%\"" /%FTPFolder.txt%" ^
    "exit" ^
IF %ERRORLEVEL% EQU 0 (Echo No error found) ELSE (Echo An error was found)
PAUSE
