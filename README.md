# Spotistat

Spotify 청취 기록을 수집하고, 음악 취향과 변화를 보여주는 서비스입니다.

[서비스 열기](https://spotify.lth.so)

## 주요 기능

- 최근 청취 기록, 재생 횟수, 청취 시간과 기간별 통계
- 곡·앨범·아티스트 순위, 검색과 상세 페이지
- 곡 가사 조회와 Spotify 재생
- 중복 확인을 거쳐 변경할 수 있는 공유 키와 읽기 전용 공개 페이지
- 시간대, 날짜 표시, 테마와 통계 기준 설정
- Spotify 청취 기록 가져오기와 아티스트 제외 설정
- 관리자용 계정·서비스 설정

공유 키를 변경하면 이전 공유 링크는 사용할 수 없습니다.

## 저장소 구성

| 경로 | 역할 |
| --- | --- |
| `apps/client` | Astro·React 프런트엔드. shadcn/ui, TanStack Query와 Axios 사용 |
| `apps/server` | Express API, Spotify 연동, 청취 기록 수집과 통계 계산 |
| `apps/dev` | 공통 개발 도구 설정 |

데이터는 MongoDB에 저장합니다. 프런트엔드는 Astro 라우팅과 FSD 의존성 규칙을 따릅니다.

## 로컬 개발

Node.js 26과 pnpm 11.9.0, MongoDB, Spotify 개발자 앱이 필요합니다. Spotify 앱은 [개발자 대시보드](https://developer.spotify.com/dashboard)에서 설정합니다.

```sh
pnpm install --frozen-lockfile
```

### 백엔드

`apps/server/.env`에 다음 값을 설정합니다. Spotify 앱 키는 실제 값으로 교체합니다.

```dotenv
MONGO_ENDPOINT=mongodb://127.0.0.1:27017/spotify-stat
CLIENT_ENDPOINT=http://127.0.0.1:4321
API_ENDPOINT=http://127.0.0.1:8080
SPOTIFY_PUBLIC=your_spotify_client_id
SPOTIFY_SECRET=your_spotify_client_secret
TIMEZONE=Asia/Seoul
```

Spotify 앱의 Redirect URI에는 `http://127.0.0.1:8080/oauth/spotify/callback`을 등록합니다.

```sh
pnpm --filter @spotify-stat/server build
cd apps/server
node --env-file=.env build/index.js --migrate
node --env-file=.env build/index.js
```

기본 API 포트는 `8080`입니다. `.env` 파일은 저장소에 커밋하지 않습니다.

### 프런트엔드

`apps/client/.env`에 다음 값을 설정합니다.

```dotenv
PUBLIC_API_BASE_URL=/api
```

저장소 루트에서 실행합니다.

```sh
pnpm --filter spotistat exec astro dev --background
pnpm --filter spotistat exec astro dev status
pnpm --filter spotistat exec astro dev logs
pnpm --filter spotistat exec astro dev stop
```

개발 주소는 `http://127.0.0.1:4321`입니다. `/api` 요청은 기본적으로 로컬 백엔드로 전달됩니다.

프런트엔드 구조와 검증 명령은 [클라이언트 README](./apps/client/README.md)에 있습니다.

## 운영 배포

버전 태그를 올리면 GitHub Actions가 프런트엔드와 백엔드의 amd64·arm64 이미지를 GHCR에 발행합니다. ArgoCD가 클러스터에 배포합니다. 루트·클라이언트·서버의 `package.json` 버전은 태그와 같아야 합니다.

운영 프런트엔드는 `PUBLIC_API_BASE_URL=/api`, `SITE_URL=https://spotify.lth.so`로 빌드합니다. API와 OAuth는 같은 서비스 주소의 `/api` 경로를 사용합니다.

## 라이선스

[Your Spotify](https://github.com/Yooooomi/your_spotify)를 기반으로 개발했습니다. [GPL-3.0](./LICENSE) 라이선스를 따릅니다.
