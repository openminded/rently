@echo off
echo ========================================
echo Reset Transactional Data
echo (Keeping Users and Master Data)
echo ========================================
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

echo Database: %DATABASE_NAME%
echo Host: %DATABASE_HOST%
echo.
echo WARNING: This will delete all transactional data!
echo Master data (Categories, Brands, Colors, Sizes, Customers, Payment Methods, Violation Types, Laundry Partners) will be kept.
echo User accounts will be kept.
echo.
pause

echo.
echo Executing SQL script...
mysql -h %DATABASE_HOST% -u %DATABASE_USER% -p%DATABASE_PASSWORD% %DATABASE_NAME% < migrations\reset_transactional_data.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Transactional data reset!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to reset data
    echo ========================================
)

echo.
pause
