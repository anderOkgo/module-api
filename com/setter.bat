@ECHO OFF
REM Reads .env.deploy (NOT the app's own .env -- see .env.deploy.example
REM for why these are kept deliberately separate).
IF EXIST ".env.deploy" (
  FOR /F "usebackq eol=# tokens=1,* delims==" %%A IN (".env.deploy") DO (
    IF NOT "%%A"=="" SET "%%A=%%B"
  )
) ELSE (
  ECHO [setter] ERROR: .env.deploy not found. Copy .env.deploy.example to .env.deploy and fill it in, or run 0.symbolics.bat.
  EXIT /B 1
)
