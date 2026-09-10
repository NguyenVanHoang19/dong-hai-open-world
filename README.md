# Đông Hải — Village Audio v0.5

Checkpoint local Three.js + Rapier + React/Vinext. Production build và 32 test PASS; chưa nghiệm thu đồ họa hoặc gameplay runtime. Xem [báo cáo âm thanh v0.5](docs/AUDIO_V05.md).

Bản này thay cây/cỏ, nhân vật/NPC, xe máy/ô tô; thêm sân nhà và chó/gà. Footer phải ghi “Village audio 0.5”.

## Âm thanh mới

Nhạc nền, gió/chim/sóng biển, bước chân, nhảy/tiếp đất, động cơ và hiệu ứng tương tác. Bấm Bắt đầu/Tiếp tục để bật; điều chỉnh ở Cài đặt. Trang dev `/audio-check` kiểm tra audio độc lập với WebGL.

## Chạy trên máy của bạn

Cần Node.js >=22.13 và trình duyệt hỗ trợ WebGL 2.

```bash
npm ci
npm run dev
```

Mở địa chỉ terminal in ra (mặc định portable: http://localhost:5173). Chọn chơi mới hoặc tiếp tục. WASD di chuyển, Shift chạy, kéo chuột xoay camera, Space nhảy/phanh, E tương tác, F lên/xuống xe, M bản đồ, I túi đồ, P chụp PNG cảnh 3D, Esc tạm dừng.

## Chụp 5 góc để đối chiếu

Trong bản dev, thêm `?visualqa=1` vào địa chỉ game, ví dụ `http://localhost:5173/?visualqa=1`.

1. Đợi cảnh 3D và bảng VISUAL QA hiện ra.
2. Giữ nguyên kích thước cửa sổ (đề xuất 1920×1080, zoom trình duyệt 100%).
3. Chọn SHOT-01, đợi cảnh xuất hiện, bấm PNG rồi Metrics JSON.
4. Lặp lại đến SHOT-05. PNG lấy từ renderer đang chạy; không chứa HUD HTML. Nếu cần HUD, dùng chức năng chụp cửa sổ của hệ điều hành.
5. Bấm “Về màn hình chơi” để thoát chế độ đóng băng và kiểm tra di chuyển.

Chế độ này cố định camera, buổi sáng và chất lượng HIGH, không ghi đè bản lưu. Không đo FPS gameplay trong chế độ đóng băng. Metrics JSON ghi draw calls/triangles do renderer trả về, không phải điểm chất lượng. Chức năng QA chỉ bật trong dev, không bật trong production.

## Kiểm tra

```bash
npm run typecheck
npm test
npm run build
```

Nếu hiện “Không mở được thế giới 3D”, kiểm tra WebGL 2/tăng tốc đồ họa của trình duyệt. Đây không phải ảnh gameplay. Môi trường browser của tác giả đang báo `GL_RENDERER = Disabled`; vì vậy bộ này không kèm 5 ảnh gameplay đã nghiệm thu.

Các báo cáo v0.1/v0.2/v0.3 trong docs là lịch sử, không phải kết quả của checkpoint mới.
