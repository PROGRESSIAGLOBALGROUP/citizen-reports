@echo off
echo Testing solicitar-cierre endpoint...
echo.

REM Login first
curl -s -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"func.obras1@jantetelco.gob.mx\",\"password\":\"admin123\"}" ^
  > token.tmp

echo Login response saved to token.tmp
type token.tmp
echo.

REM Extract token (simplificado - en producción usar jq o similar)
echo.
echo ======================
echo Testing solicitar-cierre with reporte ID 2...
echo.

curl -v -X POST http://localhost:4000/api/reportes/2/solicitar-cierre ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ^
  -d "{\"notas_cierre\":\"Test fix\",\"firma_digital\":\"data:image/png;base64,test\"}"

echo.
echo Done
