@ECHO OFF
SET "source_folder=keys"
FOR /f "delims=" %%f IN ('dir /b "%source_folder%\*.txt"') DO (
SET /p  %%f=<%source_folder%\%%f
)