# Spotistat

Spotify 청취 기록을 모아 음악 취향과 변화를 확인하는 서비스입니다.

[서비스 열기](https://spotify.lth.so) · [전체 저장소](https://github.com/noeulnight/spotify-stat)

## 주요 기능

- **청취 기록과 통계**: 최근 들은 곡, 재생 횟수, 청취 시간과 기간별 변화를 확인합니다.
- **음악 탐색**: 곡·앨범·아티스트 순위를 조회하고, 검색과 상세 페이지로 이동합니다.
- **곡 상세**: 가사와 청취 통계를 확인하고 Spotify 재생 기능을 사용합니다.
- **공유**: 읽기 전용 공개 링크를 만듭니다. 공유 키는 중복 확인 후 변경할 수 있으며, 변경하면 이전 링크는 사용할 수 없습니다.
- **계정 설정**: 통계 기준, 시간대, 날짜 표시와 테마를 설정합니다.
- **데이터 관리**: Spotify 기록을 가져오고, 통계에서 제외할 아티스트를 관리합니다.

## 기술 구성

Astro 파일 기반 라우팅과 React를 사용합니다. UI는 기존 shadcn/ui 컴포넌트를 재사용합니다. 서버 상태는 TanStack Query, HTTP 요청은 Axios로 처리합니다.

```text
src/
├── pages/      # Astro 라우팅과 페이지 조립
├── layouts/    # 공통 문서와 레이아웃
├── app/        # 앱 초기화, 공통 셸, 전역 스타일
├── widgets/    # 화면 블록
├── features/   # 사용자 기능
├── entities/   # 도메인 모델과 API
└── shared/     # 공통 UI, HTTP 설정과 유틸리티
```

상위 레이어는 하위 레이어만 사용합니다. 세부 규칙은 [AGENTS.md](./AGENTS.md)에 있습니다.

## 로컬 개발

Node.js 22.22 이상과 실행 중인 Spotify Stat API가 필요합니다.

```sh
pnpm install --frozen-lockfile
```

프로젝트 루트의 `.env`에 API 경로를 설정합니다.

```dotenv
PUBLIC_API_BASE_URL=/api
```

개발 서버의 `/api` 요청은 기본적으로 `http://127.0.0.1:8080`으로 전달됩니다. API 주소는 `astro.config.mjs`에서 확인합니다.

```sh
pnpm exec astro dev --background
pnpm exec astro dev status
pnpm exec astro dev logs
pnpm exec astro dev stop
```

## 검증과 빌드

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

운영 빌드에서 `SITE_URL`은 서비스의 공개 URL을 지정합니다. `PUBLIC_API_BASE_URL`은 빌드 시 반영됩니다.

백엔드 설정과 배포 구성은 [전체 저장소](https://github.com/noeulnight/spotify-stat)를 참고합니다.
