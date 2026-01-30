@echo off
echo ========================================
echo Running Laundry Migration SQL
echo ========================================
echo.

REM Update these variables with your MySQL credentials
set DB_HOST=192.168.27.200
set DB_PORT=2222
set DB_NAME=rumahdinarddev
set DB_USER=rumahdinarddev
set DB_PASS=your_password_here

echo Connecting to MySQL...
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo.

REM Run the SQL file
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%~dp0manual_laundry_partner.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. The migration has been applied
    echo 2. Restart your backend server
    echo 3. The Laundry features are now ready to use!
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. MySQL is installed and in PATH
    echo 2. Database credentials are correct
    echo 3. You have permission to modify the database
    echo.
    echo Alternative: Run the SQL manually in phpMyAdmin or MySQL Workbench
    echo SQL file location: %~dp0manual_laundry_partner.sql
    echo.
)

pause
