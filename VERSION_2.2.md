# AeroComms VIAA - Phiên bản V2.2 (Release Notes & Backup)

**Thời điểm phát hành:** 04/11/2026  
**Mã phiên bản (Git Tag):** `v2.2`  
**Đặc tả:** Phiên bản hoạt động ổn định toàn diện của hệ thống Huấn luyện & Đàm thoại Hàng không VIAA.

---

## 1. Các tính năng cốt lõi trong Phiên bản V2.2
1. **Pipeline Đánh giá VIAA-GOT Chuẩn (Single Engine Lightweight):**
   - Đánh giá phát âm & khẩu lệnh nhanh gọn, chuẩn hóa theo cơ chế VIAA.
   - Hỗ trợ ghi âm WebM/OGG/MP4 qua MediaRecorder và tải trực tiếp lên endpoint `/api/evaluate-speech`.
   - Cơ chế template matching kết hợp độ tương đồng từ vựng (bag-of-words) và ngữ âm hàng không.
2. **Khởi tạo và hoạt động đồng bộ cả 5 Chương (10 Kịch bản mẫu):**
   - Hỗ trợ đầy đủ các kịch bản do cả Tổ bay (Cockpit) hoặc Thợ máy (Headset Man) khởi xướng.
   - Hiển thị thông điệp mở đầu rõ ràng ngay khi vào bài học, không bị đứng hay trắng khung chat.
3. **Bài kiểm tra quá trình (Exam Mode) thông minh:**
   - Khi học viên thử 2 lần chưa đạt ở cùng một lượt thoại, hệ thống tự động hiển thị hộp thoại lựa chọn:
     - **Thử lại lần nữa**: Tiếp tục luyện tập câu hiện tại.
     - **Chuyển câu tiếp theo**: Bỏ qua để thu thập đủ 10 cặp phản hồi hoàn chỉnh cho báo cáo cuối bài.
4. **Báo cáo kết quả huấn luyện (Save Report & Xuất PDF):**
   - Nút **Save report** trong Menu cho phép xem toàn bộ nhật ký phiên đàm thoại, điểm số, đồ thị năng lực và nhận xét của Giảng viên.
   - Hỗ trợ in trực tiếp và lưu ra file PDF chuẩn định dạng A4 sắc nét.
5. **Giao diện hiện đại, tinh gọn:**
   - Menu On/Off mặc định ẩn để tối ưu không gian luyện tập.
   - Tên bài học / trạng thái kiểm tra luôn hiển thị ghim cố định ở đầu trang.
   - Đồng bộ video clip giáo viên và lời chào âm thanh VIAA.

---

## 2. Cách khôi phục lại phiên bản V2.2 (Restore Guide)

Khi cần khôi phục lại phiên bản này sau khi thử nghiệm các thay đổi mới:

### Cách 1: Sử dụng lệnh npm (Khuyên dùng)
```bash
npm run restore:v2.2
```

### Cách 2: Sử dụng script khôi phục trực tiếp
```bash
bash scripts/restore-v2.2.sh
```

### Cách 3: Sử dụng Git Tag
```bash
git checkout v2.2
```

Thư mục sao lưu dự phòng độc lập cũng được lưu tại: `/backups/v2.2/`
