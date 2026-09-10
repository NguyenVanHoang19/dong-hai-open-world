# Chạy và kiểm tra bản local

Yêu cầu Node.js >=22.13 và trình duyệt WebGL 2 có tăng tốc đồ họa.

```bash
npm ci
npm run dev
```

Mở địa chỉ local mà terminal in ra. WASD di chuyển, kéo chuột xoay camera, Shift chạy nhanh, Space nhảy/phanh, E tương tác, F lên/xuống xe, M bản đồ, I túi đồ, Esc tạm dừng. Tiến độ lưu trên trình duyệt của thiết bị.

```bash
npm run typecheck
npm test
npm run build
```

Đọc QUALITY_REPORT.md trước khi đánh giá bản game. Unit/physics fixture pass không đồng nghĩa visual/E2E pass. Bản này chưa được nghiệm thu chất lượng đồ họa.
