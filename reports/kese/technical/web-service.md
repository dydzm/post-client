# KESE 기술적 취약점 분석 상세 보고서 - Web Service

## WS-31: 보안 프로토콜 사용
- **판단**: **취약**
- **현황**: `app/main.py`에서 `httpx.AsyncClient(verify=False)` 사용 확인.
- **영향**: SSL/TLS 검증을 건너뜀으로써 중간자 공격(MitM)을 통한 데이터 변조 및 탈취가 가능함.
- **조치방안**: `verify=True`로 설정하고 필요한 경우 신뢰할 수 있는 루트 인증서 경로를 지정하십시오.

## WS-36: 중요 정보 암호화 저장
- **판단**: **취약**
- **현황**: `ui/src/stores/collections.ts`에서 `localStorage`에 컬렉션 데이터를 JSON 직렬화하여 평문 저장.
- **영향**: XSS 취약점 또는 로컬 PC 물리적 접근 시 민감한 API 토큰과 패스워드가 노출됨.
- **조치방안**: 브라우저의 `crypto` API를 사용하여 암호화하거나, 중요 정보는 별도의 Secret 매니저 또는 세션 기반 스토리지(서버 사이드)를 이용하십시오.

## WS-13: CORS 설정
- **판단**: **취약**
- **현황**: `app/main.py`에서 `allow_origins=["*"]` 사용.
- **영향**: 임의의 웹사이트에서 본 백엔드 API를 호출할 수 있어 CSRF(Cross-Site Request Forgery)와 유사한 공격 위협에 노출됨.
- **조치방안**: 허용할 도메인(예: `http://localhost:5173`)만 명시적으로 허용하도록 수정하십시오.

## WS-41: 서버 하드닝 (SSRF 방지)
- **판단**: **취약**
- **현황**: 사용자 입력 URL을 기반으로 서버가 직접 HTTP 요청을 수행하는 구조이나, 내부 IP 대역에 대한 차단 로직이 없음.
- **영향**: `http://127.0.0.1:8000/docs` 또는 AWS 메타데이터 엔드포인트에 접근하여 서버 내부 정보를 획득할 수 있음.
- **조치방안**: 요청 전 URL의 호스트를 확인하여 사설 IP 대역(10.x.x.x, 172.16.x.x, 192.168.x.x, 127.0.0.1) 및 예약된 대역을 차단하십시오.

## WS-01: 입력 데이터 검증 (XSS/Command Injection)
- **판단**: **취약**
- **현황**:
  1. `ResponseViewer.vue`의 `iframe`에 `sandbox` 속성 부재.
  2. `app/main.py`의 `subprocess.run(shell=True)` 사용.
- **영향**: 
  1. 악성 응답 페이지를 통한 부모 창 데이터 탈취.
  2. 추후 기능 확장 시 명령 실행 권한 획득 가능성.
- **조치방안**:
  1. `iframe`에 `sandbox="allow-scripts"` 적용.
  2. `shell=False` 사용 및 입력값 정교한 검증.
