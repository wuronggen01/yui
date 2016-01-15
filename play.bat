@set MEW_PATH=%~dp0

cd @%MEW_PATH:~0,-1%

@if "%PROCESSOR_ARCHITECTURE%"=="AMD64" goto 64BIT
@if "%PROCESSOR_ARCHITEW6432%"=="AMD64" goto 64BIT
goto 32BIT

:32BIT
@%MEW_PATH:~0,-1%\runtime\commands\mew %MEW_PATH:~0,-1%\mewchan
@goto END

:64BIT
@%MEW_PATH:~0,-1%\runtime\commands\mew %MEW_PATH:~0,-1%\mewchan
@goto END

:END
