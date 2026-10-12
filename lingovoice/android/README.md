# LingoVoice Android

Android client mỏng dùng WebView để gọi LingoVoice server. App không chứa API
key AI; mọi request AI/voice vẫn đi qua Node server.

## Trò chuyện bằng giọng nói

- Nút micro trong panel Cô Linh dùng `SpeechRecognizer` native trên Android.
- App chỉ đưa transcript vào luồng chat; khóa AI và giọng trả lời vẫn nằm trên server.
- Lần đầu bấm nói, Android sẽ hỏi quyền `RECORD_AUDIO`.
- Nếu thiết bị không có dịch vụ nhận giọng nói native, web sẽ thử browser speech API.
- Đóng panel hoặc đưa app xuống nền sẽ hủy phiên nghe và giải phóng micro.

## Server mặc định

- Android Emulator: `http://10.0.2.2:4175`
- Máy thật qua USB: dùng `adb reverse` và build với `http://127.0.0.1:4175`.
- Máy thật qua Internet: build với URL HTTPS của server.

Server phải lắng nghe trên interface mạng, ví dụ:

```bash
cd lingovoice
HOST=0.0.0.0 PORT=4175 PREGEN_DISABLED=1 npm start
```

## Build

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
./gradlew assembleDebug
```

APK được tạo tại `app/build/outputs/apk/debug/app-debug.apk`.

Đổi server khi build:

```bash
./gradlew assembleDebug -PLINGOVOICE_SERVER_URL=https://example.com
```

Chạy với server local trên máy thật qua USB:

```bash
adb reverse tcp:4175 tcp:4175
./gradlew assembleDebug -PLINGOVOICE_SERVER_URL=http://127.0.0.1:4175
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Chỉ origin đúng với `LINGOVOICE_SERVER_URL` mới được xin quyền thu âm. HTTP
cleartext chỉ được phép cho `10.0.2.2`, `localhost` và `127.0.0.1`; bản dùng
trên Internet nên luôn dùng HTTPS.
