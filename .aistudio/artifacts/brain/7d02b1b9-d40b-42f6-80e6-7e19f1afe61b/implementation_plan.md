# Kế hoạch Tái cấu trúc Hệ thống Nhận diện Giọng nói (STT) & Đánh giá Phát âm Hàng không

## 1. Mục tiêu và Định hướng Kỹ thuật
Dựa trên kiến trúc của ứng dụng tham chiếu (`481b305e-ffa1-403d-930b-f75c163b1866`) và phản hồi của học viên/giáo viên:
- **Cơ chế Dual-Engine (Kết hợp song song Web Speech API & Gemini Flash Audio)**:
  - Khi bắt đầu ghi âm, kích hoạt song song `webkitSpeechRecognition` để bắt ngay lập tức các từ khóa tạm thời (interim transcript) phục vụ phản hồi thời gian thực.
  - Đồng thời ghi luồng âm thanh chất lượng cao (WAV 16kHz mono / Opus WebM qua AudioContext & MediaRecorder) vào buffer.
  - Khi người dùng bấm dừng (Stop & Transmit), luồng âm thanh được đóng gói gửi trực tiếp đến server để Gemini Flash phân tích đa phương thức (multimodal audio) kèm từ khóa hàng không ICAO, chuẩn hóa ngữ âm học viên Việt Nam (ESL phonetic mapping).
- **Thao tác thu âm một chạm (Click-to-start / Click-to-stop)**:
  - Bấm nút Mic một lần để bắt đầu thu âm (hiển thị trạng thái phát sóng Live và bộ đếm giây).
  - Bấm lại nút Mic hoặc nút Transmit để dừng thu âm và kích hoạt quy trình đánh giá.
- **Trạng thái Visual Loading & Kết quả phản hồi**:
  - Ngay sau khi bấm dừng, hiển thị ngay hộp trạng thái "Đang phân tích khẩu lệnh & âm học..." kèm spinner.
  - Sau khi server phản hồi, hiển thị transcript đã chuẩn hóa (understood as ICAO), điểm số theo 3 cấp độ (30%, 50%, 70%) và nhận xét phát âm.

---

## 2. Kế hoạch Chi tiết các Bước Thực hiện

### Bước 1: Chuẩn hóa Bộ chuyển đổi Âm thanh Client-side (Audio Capture & Converter)
- Tối ưu hóa `AudioInputControls.tsx`:
  - Khởi tạo AudioContext để lọc nhiễu, chuẩn hóa âm thanh (echoCancellation, noiseSuppression, autoGainControl).
  - Xuất âm thanh chuẩn buffer Base64 gửi kèm MIME type chính xác (`audio/webm;codecs=opus` hoặc audio WAV).
  - Cập nhật cơ chế Click-to-Start và Click-to-Stop một chạm thân thiện, trực quan.

### Bước 2: Tối ưu Endpoint Đánh giá Âm thanh `/api/evaluate-speech` trong `server.ts`
- Bổ sung cấu trúc prompt nhận diện âm học chuyên sâu:
  - Đưa trực tiếp audio buffer (inlineData base64) vào Gemini `FAST_TEXT_MODEL` (`gemini-3.1-flash-lite` hoặc fallback `gemini-flash-latest`).
  - Cung cấp ngữ cảnh mục tiêu (expected ICAO turn) và danh sách biến âm ESL Việt Nam thường gặp (ví dụ: "Round" -> "Ground", "Cokpi" -> "Cockpit", "Chock" -> "Chocks", "Brak" -> "Brakes", "To ba" -> "Towbar").
  - Xử lý tình huống âm thanh nhiễu hoặc mạng trễ: nếu Gemini Multimodal gặp độ trễ quá cao, tự động dùng kết quả Web Speech API đã qua bộ chuẩn hóa `normalizeVietnameseAviationSpeech`.

### Bước 3: Cập nhật Trạng thái Visual Loading & Phản hồi UI
- Trong `DialogueChat.tsx` và `AudioInputControls.tsx`:
  - Khi học viên bấm dừng nói, tin nhắn của học viên hiển thị trạng thái pulsing/loading mượt mà với nội dung `🎙️ Đang phân tích khẩu lệnh hàng không...`.
  - Khi có kết quả: tự động cập nhật nội dung hiển thị sang khẩu lệnh đã nhận diện, hiển thị thẻ "Nghĩa tiếp nhận ICAO" (Understood as) và chi tiết bù trừ biến âm (Phonetic tolerance applied).
  - Áp dụng chuẩn qua câu theo đúng 3 cấp độ:
    - Mức 1 (Cơ bản): Trên 30% là đạt.
    - Mức 2 (Tiêu chuẩn huấn luyện): Trên 50% là đạt.
    - Mức 3 (Đạt chuẩn đầu ra): Trên 70% là đạt.

### Bước 4: Kiểm thử và Xác thực Toàn diện
- Chạy `lint_applet` và `compile_applet` để đảm bảo không có lỗi cú pháp hoặc TypeScript.
- Kiểm tra các mẫu câu thực tế như "Round to cokpit", "Chock in posision", "Releas park brak" để xác nhận hệ thống nhận diện nhanh, chính xác và chấm điểm đúng chuẩn.
