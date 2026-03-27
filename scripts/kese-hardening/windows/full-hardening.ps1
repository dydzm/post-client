# KESE Windows 계정 및 서비스 하드닝 스크립트
# KISA 주요정보통신기반시설 취약점 분석평가 가이드라인 기반

Write-Host "=== KESE Windows 보안 하드닝 시작 ===" -ForegroundColor Green

# 1. 계정 정책 하드닝
Write-Host "[W-03~05] 패스워드 및 계정 잠금 정책 설정 중..."
net accounts /minpwlen:12 /maxpwage:90 /minpwage:1 /uniquepw:15 /lockoutthreshold:5 /lockoutduration:15 /lockoutwindow:15

# 2. 불필요한 서비스 비활성화
$unnecessaryServices = @(
    "RemoteRegistry",
    "Telnet",
    "TFTP",
    "SNMPTRAP"
)

foreach ($service in $unnecessaryServices) {
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc) {
        Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
        Set-Service -Name $service -StartupType Disabled
        Write-Host "  비활성화됨: $service"
    }
}

# 3. 네트워크 보안 (방화벽 활성화)
Write-Host "[W-22] Windows 방화벽 활성화 중..."
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# 4. 세션 타임아웃 (화면 보호기)
Write-Host "[W-06] 세션 타임아웃(10분) 및 암호 보호 설정 중..."
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name ScreenSaveTimeOut -Value 600
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name ScreenSaverIsSecure -Value 1

Write-Host "=== 하드닝 완료. 시스템을 재시작하거나 로그오프 후 다시 로그인하십시오. ===" -ForegroundColor Green
