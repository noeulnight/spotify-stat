# Spotify Stat 프론트엔드 재구현 계획

기존 Spotify Stat의 기능을 기준으로 Spotistat 프론트엔드를 재구현한다. Google Material 3 기본 디자인과 FSD 구조를 적용한다.

## 1. 디자인 기준

- [Google Material 3](https://m3.material.io/)를 UI 설계의 우선 기준으로 사용한다.
- 공식 `@material/web` 컴포넌트와 기본 스타일을 우선 사용한다.
- 색상만 비슷하게 적용하거나 임의 CSS로 Material 컨트롤을 재현하지 않는다.
- 색상, 타이포그래피, 형태, 간격, 상태 표현, 접근성은 Material 지침을 따른다.
- 공식 컴포넌트로 제공하지 않는 차트, 표, 날짜 범위 선택은 Material 지침에 맞는 구현 방식을 별도로 정한다.
- 별도 요청 없이 소개 화면, 예시 데이터, 장식용 콘텐츠를 추가하지 않는다.

## 2. 공통 구성과 기능

| 영역 | 기존 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 앱 레이아웃 | 사이드 메뉴, 모바일 메뉴, 현재 메뉴 표시 | AppShell, Navigation |
| 페이지 상단 | , 설명, 작업 버튼 | PageHeader |
| 기간 선택 | 오늘, 이번 주, 이번 달, 올해, 전체, 직접 선택 | PeriodSelector, DateRangeDialog |
| 검색 | 곡·아티스트·앨범 검색, 상세 이동 | CatalogSearch, SearchResults |
| 공유 | 공개 토큰을 포함한 현재 페이지 링크 복사 | SharePageAction |
| 곡 작업 | Spotify 재생, 플레이리스트 추가 | PlayTrackAction, TrackMenu |
| 다중 선택 | 클릭·Ctrl·Shift 선택, 선택 곡 작업 | TrackSelectionToolbar |
| 플레이리스트 | 새 목록 생성, 기존 목록에 추가, 곡 수 선택 | PlaylistDialog |
| 상태 표시 | 로딩, 알림, 데이터 없음 | LoadingState, EmptyState, FeedbackMessage |

검색, 공유, 재생 기록, 플레이리스트는 기존 앱에서 독립 페이지가 아니다. 새 구현에서는 조회 오류와 재시도 상태도 명확하게 구분한다.

## 3. 페이지별 구성

기존 라우트의 화면은 설정 하위 화면을 포함해 21개다.

### 3.1 홈과 통계

| 페이지 | 기존 구성요소와 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 홈 `/` | 사용자 인사, 기간 선택, 현재 재생 곡·진행률, 청취 횟수·시간·아티스트 수, 최다 청취 곡·아티스트, 청취 시간 추이, 시간대별 분포, 재생 기록 | NowPlaying, ListeningSummary, TopTrackCard, TopArtistCard, ListeningTimeChart, HourlyDistributionChart, ListeningHistory |
| 전체 통계 `/all` | 기간 선택, 아래 차트 9개 | StatisticsDashboard, 차트별 컴포넌트 |
| 최장 세션 `/sessions` | 기간 내 최장 청취 세션 30개, 세션별 시간과 곡 목록 | LongestSessionsList, ListeningSessionItem |

홈 재생 기록은 선택 기간을 따르거나 전체 기록을 표시할 수 있다. 추가 로딩, 곡 선택, 선택 곡 작업을 지원한다.

현재 재생 영역은 재생 중·일시 정지·재생 없음·접근 불가·오류 상태를 구분한다. 접근 권한이 부족하면 소유자에게 Spotify 재연결을 안내한다.

전체 통계 차트:

1. 상위 아티스트
2. 하루 시간대별 청취 분포
3. 기간별 아티스트 청취 비중
4. 시간대별 최다 청취 항목: 곡·앨범·아티스트 전환
5. 기간별 청취 횟수
6. 기간별 청취 시간
7. 기간별 서로 다른 아티스트 수
8. 청취 앨범의 평균 발매 연도
9. 곡당 평균 참여 아티스트 수

### 3.2 순위

| 페이지 | 기존 구성요소와 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 곡 순위 `/top/songs` | 순위, 곡·앨범·아티스트, 청취 횟수·시간·비중, 추가 로딩, 재생, 다중 선택, 플레이리스트 추가 | TopTracksList, RankedTrackRow, TrackSelectionToolbar |
| 아티스트 순위 `/top/artists` | 순위, 이미지·이름·장르, 청취 횟수·시간·비중, 추가 로딩, 상세 이동 | TopArtistsList, RankedArtistRow |
| 앨범 순위 `/top/albums` | 순위, 커버·앨범·아티스트, 청취 횟수·시간·비중, 추가 로딩, 상세 이동 | TopAlbumsList, RankedAlbumRow |

세 순위 화면은 공통 기간 선택을 사용한다.

### 3.3 상세

상세 페이지는 현재 기간 선택 없이 전체 기록을 조회한다. 세 화면 모두 로딩 상태와 청취 기록이 없는 항목의 안내가 필요하다.

| 페이지 | 기존 구성요소와 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 곡 상세 `/song/:id` | 커버·곡명·아티스트, 전체 순위와 인접 순위 이동, 관련 아티스트·앨범, 총 청취 횟수, 최초·최근 청취 시각, 가장 많이 들은 두 달, 최근 재생 기록 | TrackDetailHeader, TrackRankNavigation, TrackContext, ListeningMilestones, BestMonths, TrackHistory |
| 아티스트 상세 `/artist/:id` | 이미지·이름·장르, 전체 순위, 총 청취 횟수, 최초·최근 청취 곡, 상위 두 달, 시간대별 분포, 인기 곡·앨범, 통계 제외·해제, 인기 곡 플레이리스트 추가 | ArtistDetailHeader, ArtistRankNavigation, ArtistListeningSummary, ArtistTopTracks, ArtistTopAlbums, BlacklistArtistAction |
| 앨범 상세 `/album/:id` | 커버·앨범명·아티스트, 전체 순위, 참여 아티스트, 수록곡 수·총 길이, 최초·최근 청취 곡, 청취 횟수 기준 수록곡 목록 | AlbumDetailHeader, AlbumRankNavigation, AlbumContext, AlbumListeningMilestones, AlbumTrackList |

앨범 API의 추가 통계 필드는 현재 화면에 모두 표시되지 않는다. 별도 요청 없이 추가 표시하지 않는다.

### 3.4 취향 비교

| 페이지 | 기존 구성요소와 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 비교 설정 `/collaborative/affinity` | 비교 사용자, 곡·앨범·아티스트 유형, 기간, Average·Minima 방식, 방식 설명, 계산 실행 | AffinityForm, ParticipantSelector, AffinityModeSelector |
| 곡 결과 `/collaborative/top/songs/:mode` | 참여자·기간·방식, 곡 순위, 곡별 가장 많이 즐긴 사용자, 재생, 플레이리스트 추가 | AffinityResultHeader, AffinityTrackList |
| 앨범 결과 `/collaborative/top/albums/:mode` | 참여자·기간·방식, 앨범 순위, 앨범별 가장 많이 즐긴 사용자 | AffinityResultHeader, AffinityAlbumList |
| 아티스트 결과 `/collaborative/top/artists/:mode` | 참여자·기간·방식, 아티스트 순위, 아티스트별 가장 많이 즐긴 사용자 | AffinityResultHeader, AffinityArtistList |

- Average: 사용자별 청취 비중의 평균을 사용한다.
- Minima: 사용자별 청취 비중 중 최솟값을 사용한다.
- 결과를 단순한 취향 일치율로 바꾸어 설명하지 않는다.
- 기능 허용 설정과 공개 방문자 제한을 유지한다.

### 3.5 설정

| 페이지 | 기존 구성요소와 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 계정 `/settings/account` | 계정 정보·이름 변경, Spotify 계정 정보, 테마 선택, Spotify 재연결, 데이터 가져오기, 공개 토큰 생성·삭제 | AccountSettings, SpotifyConnection, ThemeSetting, HistoryImporter, PublicAccessSetting |
| 통계 `/settings/statistics` | 제외 아티스트 관리, 시간대, 날짜 형식, 집계 기준을 횟수·시간으로 변경 | ArtistBlacklist, TimezoneSetting, DateFormatSetting, MeasurementSetting |
| 관리자 `/settings/admin` | 사용자별 관리자 권한 변경, 사용자 삭제, 신규 가입 허용, 취향 비교 기능 허용 | UserAdministration, RegistrationSetting, AffinityAvailabilitySetting |

데이터 가져오기 구성:

- 일반 계정 데이터와 확장 스트리밍 기록 선택
- 파일 업로드와 진행률
- 가져오기 이력과 성공·실패 상태
- 실패 작업 재시도와 정리

일반 사용자·관리자·공개 방문자의 화면과 작업 조건을 구분한다. 사용자 삭제는 기존 확인 절차와 영구 삭제 안내를 유지한다.

### 3.6 로그인과 오류 및 진단

| 페이지 | 기존 구성요소와 기능 | 컴포넌트 분리 제안 |
|---|---|---|
| 로그인 `/login` | Spotify 로그인, 로그인 기억, 기존 로그인 사용자 이동 | SpotifyLoginForm |
| 로그아웃 `/logout` | 로그아웃 처리와 이동 | LogoutPage |
| 가입 제한 `/registrations-disabled` | 가입할 수 없는 상태 안내 | RegistrationDisabledPage |
| 연결 설정 오류 `/oauth/spotify` | API 주소를 프론트 주소로 잘못 지정한 경우 안내 | ApiConfigurationErrorPage |
| 진단 `/benchmarks` | API별 실행, 전체 순차 실행, 요청 시간 표시 | BenchmarkTable, BenchmarkRunAction |

`/oauth/spotify`는 기존 프론트의 설정 오류 안내 경로다. 정상 OAuth 처리는 백엔드 경로와 구분한다.

## 4. FSD 구조 제안

| 위치 | 책임 |
|---|---|
| `src/app` | 앱 초기화, Query Provider, 인증 초기화 조립, 전역 Material 스타일 |
| `src/pages` | Astro 라우트 진입점, 문서 셸, 페이지 조립 |
| `src/views` | 각 페이지의 화면 구성 |
| `src/widgets` | 앱 메뉴, 검색 영역, 청취 요약, 재생 기록, 순위 목록 |
| `src/features` | 기간 변경, 로그인, 재생, 곡 선택, 플레이리스트 추가, 공유, 가져오기, 설정 변경 |
| `src/entities` | 곡·앨범·아티스트·사용자·청취 기록의 타입, 조회 API, 기본 표시 |
| `src/shared` | Axios 공통 설정, 날짜·시간 포맷, 기본 UI, 차트 표시 도구 |

- 상위 레이어는 하위 레이어만 참조한다.
- 같은 레이어의 서로 다른 슬라이스를 직접 참조하지 않는다. 조립은 상위 레이어에서 한다.
- 슬라이스 외부에서는 `index.ts` 공개 API를 사용한다.
- 화면 블록, 사용자 행동, 도메인 표시를 기준으로 나눈다. 작은 마크업까지 일괄 분리하지 않는다.
- 곡·앨범·아티스트 목록은 정보와 작업이 다르다. 각각 구현하고 실제 중복만 추출한다.
- 사용하지 않는 레이어 폴더, 예시 기능, 공통 래퍼를 미리 만들지 않는다.

## 5. 구현 방향 제안

### 앱과 라우팅

Astro는 진입점과 문서 셸을 맡고 React는 상호작용을 맡는다. React 앱 루트와 클라이언트 라우팅, Query Provider 공유 범위는 구현 전에 결정한다. 독립된 React 아일랜드마다 별도 캐시를 만드는 구성을 피한다. 상세 URL 직접 접속과 새로고침도 지원해야 한다.

### API와 상태

- 기존 백엔드 API 계약을 우선 유지한다. 프론트에서 Spotify 인증을 새로 처리하지 않는다.
- 서버 데이터는 `@tanstack/react-query`, HTTP 요청은 `axios`를 사용한다.
- 쿼리 키에는 해당 조회에 영향을 주는 사용자·공개 접근 구분·기간·집계 기준을 포함한다.
- 목록 추가 조회는 `useInfiniteQuery`로 처리한다.
- 현재 재생과 가져오기 진행률은 필요한 동안만 주기적으로 조회한다.
- 화면 선택 상태와 대화상자 상태는 React 로컬 상태로 관리한다.
- 설정 변경 후 영향받는 쿼리만 갱신한다. 로그아웃·계정 변경 시 이전 사용자의 캐시가 노출되지 않도록 처리한다.
- 기간과 비교 조건의 URL 표현, 공개 링크의 토큰 전달 계약을 유지한다.

### UI와 확인 기준

- Material 공식 컴포넌트를 우선 적용한다. 별도 디자인 시스템을 만들지 않는다.
- 차트 라이브러리와 날짜 범위 선택 도구는 아직 미정이다.
- 조회 영역마다 로딩·오류·빈 데이터 상태를 구분한다.
- 모바일, 키보드 조작, 곡 다중 선택, 공개 방문자 제한을 확인한다.
- 페이지 구현 완료 시 기존 기능 목록, API 연결, FSD 의존성, 빌드를 확인한다.

## 6. 구현 순서 제안

1. 앱 기반: React 앱 셸, 인증, Axios, Query Provider, Material 기본 UI.
2. 홈: 기간 선택, 요약, 현재 재생, 재생 기록.
3. 순위와 상세: 곡, 아티스트, 앨범 순서.
4. 통계와 세션: 차트 9개, 최장 세션.
5. 작업 기능과 설정: 재생, 플레이리스트, 공유, 가져오기, 관리자 설정.
6. 취향 비교와 진단.

실제 구현 시 각 단계에서 화면에 노출하는 작업은 동작까지 함께 완성한다.

## 7. 구현 전 결정할 항목

- API 서버 주소, 개발 환경 연결 방식, 쿠키·CORS·OAuth 리다이렉트 설정
- React 라우팅 방식과 Astro 경로 처리, Query Provider 공유 범위
- 차트 라이브러리와 날짜 범위 선택 도구
- 첫 구현 페이지와 단계별 포함 범위

## 8. 주요 근거 코드

경로는 위 분석 기준 커밋의 저장소 루트를 기준으로 한다.

- 라우트: `apps/client/src/App.tsx`
- 메뉴·공유: `apps/client/src/components/Layout/Sider/`
- API 계약: `apps/client/src/services/apis/api.ts`
- 페이지: `apps/client/src/scenes/`
- 공통 UI와 기능: `apps/client/src/components/`
- 기간과 URL 조건: `apps/client/src/services/intervals.ts`
- 초기 인증·공개 토큰: `apps/client/src/components/Wrapper/Wrapper.tsx`
