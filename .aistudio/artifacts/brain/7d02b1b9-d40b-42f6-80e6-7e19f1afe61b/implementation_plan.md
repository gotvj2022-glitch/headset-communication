# Kế hoạch Tích hợp Docker Offline AI (Faster-Whisper + LocalAI)

## 1. Mục tiêu
Tích hợp toàn diện bộ Docker container đang chạy trên máy chủ học viên (`localhost`):
- **Container `faster-whisper` (Port 8000)**: Đảm nhận Speech-to-Text (STT) siêu tốc trực tiếp tại máy học viên qua chuẩn OpenAI `/v1/audio/transcriptions`.
- **Container `localai-tts` (Port 8081)**: Đảm nhận Text-to-Speech (TTS) âm thanh qua `/v1/audio/speech` và chấm điểm/phản hồi ICAO qua `/v1/chat/completions`.
- **Hoạt động 100% Offline**: Giảm độ trễ xuống mức tối đa (dưới 500ms), không phụ thuộc vào quota hay mạng internet, mang lại trải nghiệm đàm thoại mượt mà cho học viên.

---

## 2. Các thay đổi kiến trúc & mã nguồn

### A. Cập nhật Types (`src/types/index.ts`)
- Thêm provider `'docker'` vào `LocalAiProvider`.
- Mở rộng `LocalAiConfig`:
  - `dockerOfflineEnabled`: boolean
  - `whisperEndpoint`: string (mặc định: `http://localhost:8000/v1`)
  - `localAiEndpoint`: string (mặc định: `http://localhost:8081/v1`)
  - `whisperModel`: string (mặc định: `Systran/faster-whisper-small` hoặc `whisper-1`)
  - `localAiModel`: string (mặc định: `localai` hoặc model có sẵn)
  - `ttsVoice`: string (giọng đọc phi công/mặt đất)

### B. Tiện ích Client STT & TTS Docker (`src/utils/dockerAiClient.ts`)
- `transcribeWithFasterWhisper(audioBlob, endpoint, model)`: Gửi multipart `audio/webm` tới `http://localhost:8000/v1/audio/transcriptions` để nhận verbatim transcript trong ~200-300ms.
- `synthesizeWithLocalAiTts(text, speaker, endpoint, voice)`: Gọi `http://localhost:8081/v1/audio/speech` để nhận luồng âm thanh WAV/MP3 phát trực tiếp, có fallback sang browser speech synthesis nếu cần.
- `testDockerServices(whisperUrl, localAiUrl)`: Ping đồng thời cả 2 container `:8000` và `:8081` để báo trạng thái Xanh (Online) trực tiếp trên giao diện.

### C. Cập nhật Pipeline Huấn luyện (`src/App.tsx` & `server.ts`)
- Khi bật chế độ Docker Offline:
  1. Ghi âm audio -> Gửi trực tiếp sang `faster-whisper` (:8000) lấy transcript.
  2. So khớp khẩu lệnh ICAO chuẩn và chấm điểm qua template matcher + LocalAI (:8081).
  3. Phát âm thanh phản hồi của Cockpit/Ground qua `localai-tts` (:8081).
- Nếu Docker gặp sự cố tạm thời, tự động chuyển đổi mượt mà sang Cloud Gemini API để không làm gián đoạn bài học của học viên.

### D. Giao diện Menu Local AI (`src/components/TopControls.tsx` & `src/components/LocalAiGuideModal.tsx`)
- Thêm Preset nổi bật: **"Docker Offline Suite (Whisper :8000 + LocalAI :8081)"**.
- Bổ sung công cụ kiểm tra kết nối (Ping Test) hiển thị rõ 2 dịch vụ:
  - 🟢 Faster-Whisper (Port 8000) - Sẵn sàng nhận diện giọng nói
  - 🟢 LocalAI TTS / LLM (Port 8081) - Sẵn sàng phát âm thanh & chấm điểm
- Huy hiệu trạng thái trên thanh điều khiển: `⚡ DOCKER OFFLINE (PORT 8000/8081)`.

---

## 3. Kế hoạch kiểm tra & nghiệm thu (Verification)
1. **Kiểm tra build & types**: Chạy `compile_applet` và `lint_applet` đạt 0 lỗi.
2. **Kiểm tra Ping Test**: Bật Menu -> chọn Docker Offline -> bấm "Kiểm tra kết nối Docker".
3. **Thử nghiệm đàm thoại Offline**: Ghi âm giọng nói trong kịch bản và xác nhận luồng xử lý chạy qua Faster-Whisper + LocalAI với độ trễ phản hồi tức thì.
