# 파일 탐색기 2-서버 구성

이 프로젝트는 다음 구조를 기준으로 동작합니다.

- 1번 서버: 파일 시스템 조회 API 컨테이너(FastAPI + Docker)
- 2번 서버: API를 호출해서 파일 목록을 보여주는 웹(React + Vite)

## 1번 서버(API) 실행

`server1-api` 폴더에서 실행:

```bash
docker compose up -d --build
```

- 기본 포트: `8000`
- 탐색 대상 디렉토리: 컨테이너 `/data` (호스트의 `server1-api/sample-data`가 마운트됨, 업로드 가능)
- 헬스체크: `GET /health`
- 디렉토리 조회: `GET /api/list?path=상대경로`
- 파일 업로드: `POST /api/upload?path=상대경로` (`multipart/form-data`, key=`file`)
- 파일 다운로드: `GET /api/download?path=상대파일경로`

예시:

- 루트 조회: `http://SERVER1_IP:8000/api/list?path=`
- 하위 폴더 조회: `http://SERVER1_IP:8000/api/list?path=docs`

## 2번 서버(웹) 실행

`server2-web` 폴더에서 실행:

```bash
npm install
cp .env.example .env
```

`.env`에서 API 주소를 1번 서버 주소로 변경:

```env
VITE_API_BASE_URL=http://SERVER1_PUBLIC_IP:8000
```

개발 서버 실행:

```bash
npm run dev
```

빌드:

```bash
npm run build
```

## 서버 간 통신 체크리스트

- 1번 서버의 `8000` 포트가 2번 서버에서 접근 가능해야 합니다.
- 방화벽/보안그룹에서 2번 서버 -> 1번 서버 `8000/tcp` 허용이 필요합니다.
- 현재 API는 CORS `*` 허용으로 설정되어 있습니다. 운영환경에서는 2번 서버 도메인만 허용하도록 제한하세요.
