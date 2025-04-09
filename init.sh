#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "프로젝트 초기 설정을 시작합니다 (Ubuntu 기준)..."

# 0. 필수 패키지 설치 (sudo 권한 필요)
echo "필수 패키지(wget, unzip, openjdk-17-jdk) 설치를 시도합니다..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update || echo "apt-get update 실패. 계속 진행합니다."
    sudo apt-get install -y wget unzip openjdk-17-jdk || { echo "필수 패키지 설치 실패. 수동으로 설치해주세요: sudo apt-get install -y wget unzip openjdk-17-jdk"; exit 1; }
else
    echo "apt-get을 찾을 수 없습니다. 다른 패키지 관리자를 사용하거나 수동으로 wget, unzip, openjdk-17-jdk를 설치해주세요."
    # Add checks/commands for other package managers like yum if needed
fi
echo "필수 패키지 확인 완료."

# 1. Java (JDK) 설치 확인
echo "Java JDK 설치 여부를 확인합니다..."
if ! command -v java &> /dev/null || ! java -version 2>&1 | grep -q 'openjdk version "17'; then
    echo "경고: Java JDK 17이 설치되어 있지 않거나 경로가 설정되지 않았습니다."
    echo "Android SDK 설치 및 빌드를 위해 OpenJDK 17 설치를 권장합니다."
    echo "설치 명령어 예시: sudo apt install openjdk-17-jdk -y"
    # Optionally exit here if JDK is strictly required before proceeding
    # exit 1
else
    echo "Java JDK 확인 완료."
fi


# 2. Node.js 및 npm 설치 확인
echo "Node.js 및 npm 설치 여부를 확인합니다..."
if ! command -v node &> /dev/null
then
    echo "오류: Node.js가 설치되어 있지 않습니다. Node.js (LTS 버전 권장)를 설치해주세요."
    exit 1
fi

if ! command -v npm &> /dev/null
then
    echo "오류: npm이 설치되어 있지 않습니다. Node.js와 함께 설치되는 경우가 많으니 확인해주세요."
    exit 1
fi

echo "Node.js 및 npm 확인 완료."

# 3. npm 의존성 설치
echo "npm 의존성을 설치합니다..."
npm install --legacy-peer-deps # React Native 프로젝트는 종종 peer dependency 충돌이 발생하므로 --legacy-peer-deps 사용
if [ $? -ne 0 ]; then
    echo "오류: npm 의존성 설치에 실패했습니다."
    exit 1
fi
echo "npm 의존성 설치 완료."

# 4. Android SDK 설치 및 설정
echo "Android SDK 설치 및 설정을 시작합니다..."
ANDROID_SDK_ROOT="$HOME/Android/Sdk"
CMDLINE_TOOLS_PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin"
SDKMANAGER="$CMDLINE_TOOLS_PATH/sdkmanager"

# Command-line tools 설치 확인 및 설치
if [ ! -f "$SDKMANAGER" ]; then
    echo "Android SDK Command-line Tools가 $CMDLINE_TOOLS_PATH 에 없습니다. 설치를 시도합니다..."
    # Google에서 제공하는 command-line tools 다운로드 URL (버전 번호는 변경될 수 있음)
    # 최신 버전 확인: https://developer.android.com/tools#command-line-tools-only
    CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    TOOLS_ZIP="cmdline-tools.zip"

    mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
    echo "Command-line Tools 다운로드 중: $CMDLINE_TOOLS_URL"
    wget -q --show-progress -O "$TOOLS_ZIP" "$CMDLINE_TOOLS_URL"
    if [ $? -ne 0 ]; then
        echo "오류: Command-line Tools 다운로드 실패. URL을 확인하거나 수동으로 설치해주세요."
        exit 1
    fi

    echo "Command-line Tools 압축 해제 중..."
    # 압축 해제 시 내부에 'cmdline-tools' 디렉토리가 생성될 수 있으므로 임시 디렉토리에 풀고 'latest'로 이동
    unzip -q "$TOOLS_ZIP" -d "$ANDROID_SDK_ROOT/cmdline-tools/temp"
    # 압축 해제 후 생성된 디렉토리 이름이 'cmdline-tools'일 가능성이 높음
    mv "$ANDROID_SDK_ROOT/cmdline-tools/temp/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
    rm -rf "$ANDROID_SDK_ROOT/cmdline-tools/temp" # 임시 디렉토리 삭제
    rm "$TOOLS_ZIP" # zip 파일 삭제

    if [ ! -f "$SDKMANAGER" ]; then
        echo "오류: Command-line Tools 설치 후에도 sdkmanager를 찾을 수 없습니다. 경로를 확인해주세요: $SDKMANAGER"
        exit 1
    fi
    echo "Command-line Tools 설치 완료."
else
    echo "Android SDK Command-line Tools가 이미 설치되어 있습니다: $CMDLINE_TOOLS_PATH"
fi

# 환경 변수 설정 (현재 세션에만 적용, 영구 적용은 .bashrc 등에 추가 필요)
export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT
export PATH=$PATH:$CMDLINE_TOOLS_PATH

# 필요한 SDK 패키지 정의 (build.gradle 기반)
PLATFORM_VERSION="android-35"
BUILD_TOOLS_VERSION="35.0.0"
REQUIRED_PACKAGES="platforms;$PLATFORM_VERSION build-tools;$BUILD_TOOLS_VERSION"

echo "필요한 SDK 패키지 설치 확인 및 설치: $REQUIRED_PACKAGES"
# sdkmanager 실행 전 라이선스 동의 시도 (yes 명령어 사용)
echo "SDK 라이선스 동의를 시도합니다..."
yes | "$SDKMANAGER" --licenses > /dev/null || echo "라이선스 동의 중 오류 발생 가능성 있음. 수동 확인 필요."

echo "패키지 설치 중 ($REQUIRED_PACKAGES)... 시간이 걸릴 수 있습니다."
"$SDKMANAGER" --install $REQUIRED_PACKAGES || { echo "오류: SDK 패키지 설치 실패."; exit 1; }
echo "SDK 패키지 설치 완료."

# android/local.properties 파일 생성 또는 업데이트
echo "android/local.properties 파일을 설정합니다..."
LOCAL_PROPERTIES_PATH="android/local.properties"
# 경로의 슬래시를 이스케이프 처리해야 sed에서 오류가 나지 않음
ESCAPED_SDK_ROOT=$(echo $ANDROID_SDK_ROOT | sed 's/\//\\\//g')
if [ -f "$LOCAL_PROPERTIES_PATH" ]; then
    # 파일이 존재하면 sdk.dir 업데이트 또는 추가
    if grep -q "^sdk\.dir=" "$LOCAL_PROPERTIES_PATH"; then
        sed -i "s/^sdk\.dir=.*/sdk.dir=$ESCAPED_SDK_ROOT/" "$LOCAL_PROPERTIES_PATH"
        echo "$LOCAL_PROPERTIES_PATH 파일의 sdk.dir 업데이트 완료."
    else
        echo "sdk.dir=$ANDROID_SDK_ROOT" >> "$LOCAL_PROPERTIES_PATH"
        echo "$LOCAL_PROPERTIES_PATH 파일에 sdk.dir 추가 완료."
    fi
else
    # 파일이 없으면 생성
    echo "sdk.dir=$ANDROID_SDK_ROOT" > "$LOCAL_PROPERTIES_PATH"
    echo "$LOCAL_PROPERTIES_PATH 파일 생성 및 sdk.dir 설정 완료."
fi
echo "Android SDK 설정 완료."


# 5. .env 파일 확인
echo ".env 파일을 확인합니다..."
if [ ! -f .env ]; then
    echo "경고: .env 파일이 존재하지 않습니다. 필요한 환경 변수를 설정하기 위해 .env 파일을 생성하고 내용을 채워주세요."
    # 필요하다면 여기서 .env.example 파일을 복사하는 로직을 추가할 수 있습니다.
    # 예: cp .env.example .env
else
    echo ".env 파일이 존재합니다. 필요한 환경 변수가 올바르게 설정되었는지 확인해주세요."
fi

# 6. Android 프로젝트 클린 (선택 사항)
# echo "Android 프로젝트를 클린합니다..."
# (cd android && ./gradlew clean)
# if [ $? -ne 0 ]; then
#     echo "경고: Android 프로젝트 클린 중 오류가 발생했습니다."
# fi
# echo "Android 프로젝트 클린 완료."


echo "프로젝트 초기 설정이 완료되었습니다!"
echo "이제 다음 명령어를 사용하여 앱을 실행할 수 있습니다:"
echo " - Android: npm run android"
echo " - iOS: npm run ios (iOS 설정이 완료된 경우)"

exit 0
