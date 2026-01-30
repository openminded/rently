@echo off
echo ========================================
echo Seed Dummy Data for Testing
echo ========================================
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

echo Database: %DATABASE_NAME%
echo Host: %DATABASE_HOST%
echo.
echo This will create:
echo - 5 Users (all roles, password: zzzz)
echo - Master Data (Categories, Brands, Colors, Sizes, etc.)
echo - 8 Items with variants
echo - 35 Item Instances (SKUs)
echo - 5 Customers
echo - 3 Laundry Partners
echo.
pause

echo.
echo Executing SQL script...
mysql -h %DATABASE_HOST% -u %DATABASE_USER% -p%DATABASE_PASSWORD% %DATABASE_NAME% < migrations\seed_dummy_data.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Dummy data seeded!
    echo ========================================
    echo.
    echo Login credentials:
    echo - superadmin / zzzz
    echo - owner / zzzz
    echo - supervisor / zzzz
    echo - kasir / zzzz
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to seed data
    echo ========================================
)

echo.
pause
