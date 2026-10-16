## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)


## 필수 아키텍처: Astro 라우팅과 FSD

페이지와 레이아웃은 Astro의 파일 기반 구조를 사용한다. 기능과 공통 컴포넌트는 아래 FSD 의존성 규칙을 따른다. 별도의 `src/views` 계층은 만들지 않는다.

### 레이어와 책임

위에서 아래 순서로 구성한다.

- `src/pages`: Astro 파일 기반 라우팅과 페이지별 화면 조립.
- `src/layouts`: 공통 Astro 문서 셸과 슬롯 기반 레이아웃.
- `src/app`: 앱 초기화, 전역 스타일, 전역 Provider와 공통 React 앱 셸, 설정.
- `src/widgets`: 여러 기능을 조합한 독립적인 화면 블록.
- `src/features`: 사용자의 행동과 기능 단위.
- `src/entities`: 도메인 모델과 도메인별 UI.
- `src/shared`: 도메인에 의존하지 않는 공통 UI, API 기반 코드, 유틸리티.

`src/pages`의 각 `.astro` 파일이 공통 레이아웃과 해당 페이지 컴포넌트를 직접 조립한다. 고정 페이지는 `top/songs.astro`, `top/albums.astro`, `top/artists.astro`처럼 명시한다. 공통 React 앱 셸에서 페이지 값으로 화면을 선택하는 분기를 만들지 않는다. 기능 로직과 API 호출은 페이지와 레이아웃에 넣지 않는다.

### 의존성 규칙

- 상위 레이어는 하위 레이어만 import한다. 역방향 import는 금지한다.
- 같은 레이어의 서로 다른 슬라이스끼리 import하지 않는다.
- 다른 슬라이스에서 가져오는 코드는 해당 슬라이스의 `index.ts` 공개 API를 사용한다. 내부 파일 직접 import는 금지한다.
- `app`과 `shared`는 슬라이스 없이 역할별 세그먼트로 구성한다.
- 각 슬라이스 안에서 필요한 `ui`, `model`, `api`, `lib`, `config` 세그먼트만 만든다. 빈 폴더나 예시 기능은 만들지 않는다.
- `src/pages`와 `src/layouts`는 `app` 설정, 공통 앱 셸과 전역 스타일을 연결할 수 있다. 하위 레이어는 `src/pages`와 `src/layouts`를 import하지 않는다.
- Astro 슬롯으로 전달한 React 컴포넌트는 정적 HTML이다. 상호작용과 React Context가 필요한 컴포넌트는 같은 React 아일랜드 안에서 조립한다.

### 데이터와 UI 규칙

- 서버 상태는 `@tanstack/react-query`를 사용한다. HTTP 요청은 `axios`를 사용한다.
- 기능별 API 함수와 쿼리 정의는 해당 `entities` 또는 `features` 슬라이스의 `api`에 둔다.
- 공통 HTTP 설정만 `shared/api`에 둔다. 도메인 규칙을 넣지 않는다.
- Material 3 UI는 공식 `@material/web` 컴포넌트와 기본 스타일을 사용한다. 임의의 CSS로 Material 컴포넌트를 흉내 내지 않는다.
- 화면, 예시 데이터, Provider, 공통 래퍼는 실제 요청에 필요할 때만 만든다.
- 변경을 완료하기 전에 레이어 의존성과 공개 API 사용을 확인하고 빌드를 실행한다. 규칙 위반은 완료로 처리하지 않는다.


## 필수 디자인 기준: Google Material 3 우선 적용

- UI 설계와 구현은 [Google Material 3](https://m3.material.io/)를 우선 기준으로 삼는다.
- 공식 `@material/web` 컴포넌트와 기본 스타일을 먼저 사용한다. 사용자가 별도로 요청하지 않으면 임의의 디자인으로 대체하지 않는다.
- 색상만 비슷하게 적용하는 것으로 Material 적용을 완료했다고 판단하지 않는다. 타이포그래피, 형태, 간격, 상태 표현과 접근성도 공식 지침을 따른다.
- 공식 컴포넌트가 없는 영역은 Material 3 지침에 맞춰 구현한다. 기존 컴포넌트를 임의 CSS로 흉내 내지 않는다.
- 테마 적용 요청만으로 새 화면, 예시 데이터, 장식용 콘텐츠나 기능을 추가하지 않는다.
- 재구현 범위와 페이지별 구성은 `docs/frontend-plan.md`를 참고한다. 계획에 있다는 이유만으로 구현을 시작하지 않고 사용자가 요청한 범위만 구현한다.
