# Mô hình nghe của Mochi (chạy ngay trên máy)

Thư mục này chứa các mô hình nhận giọng nói Whisper. App chỉ nạp mô hình từ đây, không tải từ trang ngoài.

| Mô hình | Gốc | Bản ONNX | Phiên bản cố định (commit) | Giấy phép |
|---|---|---|---|---|
| whisper-base.en | openai/whisper-base.en | Xenova/whisper-base.en | `95bf40a508535962c6483ead40270b2e32267508` | Apache-2.0 |
| whisper-tiny.en | openai/whisper-tiny.en | Xenova/whisper-tiny.en | `79fb389fc764e7c395bd330e9531d9d32ada7049` | Apache-2.0 |

## Đã kiểm tra trước khi đưa vào

- **Nguồn tin cậy:** mô hình gốc do OpenAI phát hành. Bản chuyển sang ONNX do Xenova làm; Xenova là tác giả thư viện transformers.js mà app đang dùng.
- **Chỉ có tệp dữ liệu:** `.onnx` (trọng số) và `.json` (cấu hình, bộ tách từ). Không có tệp nào chạy được mã (`.py`, `.js`, pickle `.bin`).
- **Mã băm:** mỗi tệp đều khớp với bản gốc trên Hugging Face ở đúng commit trên. Tệp lớn dùng mã SHA-256 do Hugging Face công bố; tệp nhỏ dùng mã git blob. Mã SHA-256 của từng tệp ghi trong `MANIFEST.json`.
- **Bên trong ONNX:** chỉ dùng các phép tính chuẩn (`ai.onnx`, opset 11). Không có phép tính tự định nghĩa (custom op), không có dữ liệu nằm ở tệp ngoài, không có hàm nhúng.
- **Thư viện chạy mô hình:** `vendor/` (transformers.js 3.8.1 và onnxruntime-web) trùng từng byte với gói gốc trên npm. Gói này đã được npm kiểm tra bằng mã toàn vẹn sha512.

## Khi app chạy

- App so mã SHA-256 của từng tệp với danh sách ghi sẵn trong mã nguồn (`MODEL_SHA` trong speech.js). Lệch 1 byte là app từ chối nạp. Việc so này làm cả với bản đã lưu trong bộ nhớ đệm.
- App chặn mọi tệp không có trong danh sách.
- Trang có Content-Security-Policy: chỉ kết nối tới chính trang này (và Worker `*.workers.dev` nếu bố mẹ tự bật Azure). Giọng bé không được gửi đi đâu.

## Đổi hoặc nâng cấp mô hình

1. Tải đúng commit mới.
2. Chạy lại các bước kiểm tra ở trên.
3. Cập nhật `MANIFEST.json` và `MODEL_SHA`.
4. Đổi tên `MODEL_CACHE` (vd. `mochi-models-v2`) để máy các bé tải lại bản mới.
