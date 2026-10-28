# 🌿 ABO Partner Platform - 모바일 웹 & 앱

> 암웨이(Amway) 비즈니스를 지원하는 올인원 파트너 커뮤니티 및 교육 지원 모바일 플랫폼입니다.  
> 별도의 앱스토어 설치 없이 스마트폰에서 1초 만에 네이티브 앱처럼 설치(PWA)하여 사용할 수 있습니다.

---

## ✨ 핵심 기능

1. **📱 PWA (Progressive Web App) 완벽 지원**
   - 사파리(iOS) 및 크롬(Android)에서 **"홈 화면에 앱 설치"** 원클릭 지원
   - 상단 주소창 없는 전체화면(Standalone) 모바일 앱 환경 제공
   - 오프라인 캐싱(Service Worker) 탑재

2. **🎧 비즈니스 음원 & 학습 허브 (Audio Hub)**
   - 9개 카테고리별 비즈니스 강의 음원
   - 핵심 5줄 요약 카드 & 카카오톡 원클릭 공유
   - 백그라운드 미니 플레이어 (재생, 일시정지, 탐색바)

3. **📅 미팅 & 세미나 일정 (Schedule & Alerts)**
   - 줌(Zoom) 미팅, 퀸 쿠킹클래스, 랠리 세미나 일정
   - 브라우저 푸시 알림 및 일정별 D-Day 알림

4. **🍲 암웨이 퀸 요리 레시피 (Queen Cooking)**
   - 인덕션 단수/시간 기반 무수·저온 명품 레시피
   - 체크박스 재료 목록 및 조리 팁

5. **🛍️ 스마트 제품 카탈로그 (Product Catalog)**
   - 뉴트리라이트, 아티스트리, 홈/퍼스널 케어 브랜드 필터

6. **👑 총괄 마스터 & 파트너 관리 (Admin & RBAC)**
   - 2인 총괄 관리자(Super Admin) 시스템
   - 비밀 팀 초대 코드(`DIAMOND2026`) 자동 승인
   - 신규 가입자 대기 및 승인/탈퇴 관리
   - 기기별 로그인 세션 및 데이터 영구 보존 (`localStorage`)

---

## 🚀 GitHub Pages 1분 무료 배포 가이드

본 프로젝트를 GitHub에 올리면 완전 무료로 영구적인 전용 모바일 웹 주소가 발급됩니다.

### 1. GitHub에서 새 저장소 생성
1. [GitHub](https://github.com)에 로그인 후 우측 상단 `+` 버튼 -> **New repository** 클릭
2. Repository name 입력 (예: `abo-partner` 또는 `amway-platform`)
3. 공개 설정: **Public** 선택
4. `README`나 `.gitignore` 체크박스는 **해제한 채로** [Create repository] 클릭

### 2. 로컬 터미널에서 코드 푸시
```bash
# 원격 저장소 연결 (본인의 GitHub 아이디와 저장소 이름으로 변경)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

### 3. GitHub Pages 활성화
1. GitHub 저장소 상단 메뉴의 **Settings** 클릭
2. 좌측 사이드바의 **Pages** 클릭
3. **Build and deployment** > Source: **Deploy from a branch** 선택
4. Branch: **main** / Folder: **/ (root)** 선택 후 **Save** 클릭
5. 1~2분 후 상단에 생성된 전용 웹 주소(`https://<아이디>.github.io/<저장소명>/`) 확인!

---

## 📲 스마트폰 홈 화면에 앱으로 설치하는 방법

파트너분들에게 GitHub Pages 링크를 공유하면 즉시 스마트폰에 앱으로 설치할 수 있습니다:

* **아이폰 (Safari)**:  
  1. Safari 브라우저에서 링크 접속  
  2. 하단 중앙의 **공유 아이콘 (사각형 위로 화살표)** 클릭  
  3. 메뉴에서 **[홈 화면에 추가]** 선택 후 우측 상단 **[추가]** 클릭  
  4. 스마트폰 바탕화면에 공식 아이콘과 함께 앱이 생성됩니다!

* **안드로이드 (Chrome)**:  
  1. Chrome 브라우저에서 링크 접속  
  2. 화면 상단의 **[앱 설치]** 버튼 클릭 또는 우측 상단 메뉴(⋮) 클릭  
  3. **[앱 설치]** 또는 **[홈 화면에 추가]** 클릭

---

## 🛠️ 향후 양대 스토어 (Google Play & Apple App Store) 출시 로드맵

현재 구축된 PWA 웹 환경을 기반으로 다음 단계가 준비되어 있습니다:
- **Firebase Authentication & Cloud DB**: 다중 기기 실시간 파트너 승인 및 애플 필수 회원 탈퇴 연동
- **Capacitor 엔진 패키징**: iOS(Xcode IPA) 및 Android(APK/AAB) 네이티브 프로젝트 추출
- **GitHub Actions 클라우드 빌드**: Mac 없이도 클라우드 가상머신을 통해 iOS 앱 자동 컴파일 및 스토어 제출
