@set MEW_PATH=%~dp0

@if "%PROCESSOR_ARCHITECTURE%"=="AMD64" goto 64BIT
@if "%PROCESSOR_ARCHITEW6432%"=="AMD64" goto 64BIT
goto 32BIT

:32BIT
@%MEW_PATH:~0,-1%\..\windows-x86\mew_js %MEW_PATH:~0,-1%\mew_test %*
@goto END

:64BIT
@%MEW_PATH:~0,-1%\..\windows-x86_64\mew_js %MEW_PATH:~0,-1%\mew_test %*
@goto END

:END
