# [PRD] StoryQuest 콘텐츠 관리 시스템(CMS) 프로토타입 설계서

## 1. 프로젝트 개요
* **프로젝트명:** StoryQuest Admin Engine Prototype
* **목적:** 도서 원고와 3D 에셋을 결합하여 인터랙티브 독서 콘텐츠를 제작하고, Supabase를 통해 데이터를 실시간으로 관리하는 CMS 구축
* **핵심 원칙:** * 3D 모델 생성은 UI 패널 구현을 통한 시각적 시뮬레이션에 집중 (실제 생성 로직 제외)
    * 도서 데이터, 에셋 메타정보, 인터랙션 설정값은 **Supabase**를 통한 영구 저장
    * 로그인 과정 없이 즉시 제작 도구에 접근 가능한 오픈형 프로토타입

---

## 2. 기술 스택 (Tech Stack)

### 2.1 Frontend
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS (UI 레이아웃 및 패널 디자인)
* **3D Rendering:** Three.js / React-three-fiber (에셋 뷰어 및 프리뷰 엔진)
* **State Management:** Zustand (클라이언트 상태 및 Supabase 데이터 동기화)

### 2.2 Backend & Infrastructure (Supabase)
* **Database:** PostgreSQL (도서, 에셋, 장면 매핑 데이터 저장)
* **Storage:** Supabase Storage (3D 에셋 파일 - .glb, .gltf 저장)
* **API:** Postgrest (Supabase SDK를 통한 자동 생성 API 연동)

---

## 3. 주요 기능 요구사항

### 3.1 모듈형 에셋 관리 패널 (UI & Supabase Storage)
* **에셋 불러오기:** Supabase Storage에 저장된 3D 파일 목록을 가져와 리스트업
* **메타정보 입력:** 에셋 이름, 태그, 카테고리를 입력하고 Supabase DB에 저장
* **생성 UI 패널:** * 'AI 모델 생성' 버튼 및 프롬프트 입력창 (UI만 구현)
    * 실행 시 '생성 중...' 프로그레스 바 노출 후 미리 준비된 샘플 에셋을 결과물로 표시

### 3.2 도서 원고 및 시나리오 관리
* **원고 입력:** 도서 제목, 저자, 텍스트 원고를 입력하고 Supabase `books` 테이블에 저장
* **텍스트 트리거 설정:** 입력된 원고 중 인터랙션을 연결할 문장을 드래그하여 ID 부여

### 3.3 인터랙션 및 동작 정의 (Interaction Editor)
* **동작 정의 패널:** 특정 에셋에 대해 `Idle`, `Walk`, `Action_01` 등 애니메이션 클립 매핑
* **장면(Scene) 구성:** 특정 텍스트 트리거에 [에셋 + 동작 + 카메라 앵글] 값을 연결하여 `scenes` 테이블에 저장

### 3.4 프리뷰 생성 (Preview Engine)
* **실시간 렌더링:** 설정된 데이터를 바탕으로 실제 사용자 기기에서 보게 될 화면을 캔버스에 출력
* **데이터 fetch:** Supabase에서 해당 도서의 모든 `scenes` 데이터를 불러와 텍스트 전개에 맞춰 3D 환경 변화 시연

---

## 4. 데이터베이스 설계 (Supabase DB Schema)

### 4.1 `assets` 테이블
* `id` (uuid, PK)
* `name` (text)
* `storage_url` (text) - Supabase Storage 파일 경로
* `category` (text)
* `metadata` (jsonb) - 크기, 기본 회전값 등

### 4.2 `books` 테이블
* `id` (uuid, PK)
* `title` (text)
* `manuscript` (text) - 도서 전체 텍스트
* `author` (text)

### 4.3 `scenes` 테이블
* `id` (uuid, PK)
* `book_id` (uuid, FK)
* `trigger_text` (text) - 매핑된 문장 텍스트
* `asset_id` (uuid, FK)
* `animation_key` (text) - 실행할 동작 이름
* `camera_config` (jsonb) - 카메라 위치 및 각도

---

## 5. UI 구성 (Panels)

1.  **Asset Library Panel:** 에셋 목록 확인 및 새 파일 업로드(Storage 연동)
2.  **Creation Mock-up Panel:** AI 생성을 시뮬레이션하는 입력창 및 상태 표시창
3.  **Manuscript Editor:** 텍스트 입력 및 트리거 설정 영역
4.  **Property Inspector:** 선택된 장면에 대한 에셋 동작 및 메타정보 수정창
5.  **3D Preview Canvas:** 최종 결과물을 확인하는 메인 뷰어 영역

---

## 6. 구현 범위 및 제외 사항
* **포함:** UI 전체 레이아웃, Supabase DB/Storage 연동 CRUD, Three.js 기반 에셋 뷰어
* **제외:** 실제 AI 3D 생성 알고리즘, 사용자 로그인/회원가입 기능, 결제 시스템