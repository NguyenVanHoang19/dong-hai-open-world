# Đông Hải — Village Assets v0.4

Ngày kiểm tra: 2026-09-10. **Mã đã cập nhật, build và test PASS; chất lượng render v0.4 chưa nghiệm thu.** Hai ảnh local v0.3 của người dùng là baseline của lần sửa này.

## A. Phân tích ảnh và thay đổi đã implement

| Nhóm | Vấn đề nhìn thấy ở v0.3 | Thay đổi trong mã v0.4 |
|---|---|---|
| Cây/cỏ | Lá như khối đa diện lớn; cỏ nón nhọn; lặp hình dáng | Lá mỏng có độ cong/gân giữa, cụm cỏ nhiều lá; cây bóng mát, cây ăn quả, dừa, chuối; 3 LOD |
| Nhân vật | Vai/khuỷu/gối và balô tạo cảm giác mannequin; mặt thô | Thân, đầu, mặt, tay/chân và quần áo dựng từ tiết diện mesh; bỏ balô phồng; skin weights chuyển qua khuỷu/gối |
| NPC | Người dạng khối, khác phong cách nhân vật | Dùng cùng rig/mesh mới với biến thể áo, màu da và nón |
| Xe máy | Thân hộp, bánh đặc; ít chi tiết cơ khí | Underbone với panel bo cong, nan hoa, phuộc, gương, đèn, yên, ống xả; bánh quay, lái có damping, xe/người nghiêng |
| Ô tô | Các khối hộp chồng nhau | Hatchback với thân/cabin cong, mái và cột kính, bánh/lốp/gương; bánh quay và bánh trước đổi hướng |
| Nhà | Lặp mẫu, ít sinh hoạt, kết thúc đột ngột giữa đất trống | 20 tổ hợp mái/ban công/mái hiên/sân; tường/cột cổng mở, bàn ghế, đồ phơi, thùng, xe đậu, cây sân sau |
| Động vật | Không có | Chó ở lề gần cổng; chó/gà quanh sân sau; chân/đuôi chuyển động, đi trong phạm vi ngắn, ẩn ngoài 75 m |
| Vật liệu | Khá đồng đều, chất liệu vải nhiễu | Thêm bẩn/ẩm chân tường, giảm nhiễu vải, chia sẻ vật liệu |

Đây là **20 tổ hợp cấu hình nhà**, không phải 20 model độc lập dựng tay. Mô hình mới đều do dự án tạo bằng geometry gốc; chưa sử dụng character scan, mocap hay bộ GLB nghệ thuật hoàn thiện. Không tuyên bố đạt GTA/photorealistic hoặc >=7/10.

UI giữ cách bố trí hiện có. Footer đổi thành **Village assets 0.4** để nhận biết bản mới.

## B. Architecture

| Module | Trách nhiệm |
|---|---|
| game/organic.ts | Mesh tiết diện, lá cong và cành nối điểm |
| game/vegetation.ts | Loài cây, biến thể seed, instancing, geometry/material dùng chung; LOD 0/45/105 m |
| game/avatar.ts | Mesh skinned mới, rig 12 bones, idle/walk/run/ride/air crossfade |
| game/vehicles.ts | Xe máy/ô tô và animation bánh/lái/reset |
| game/architecture.ts | Đồ sân nhà và collider tường/cột, chừa lối giữa |
| game/animals.ts | Mô hình chó/gà, animation, phạm vi hoạt động và culling |
| game/models.ts | Nối asset mới; sửa batching mixed indexed/non-indexed, giữ cây LOD |
| game/landscape.ts | Thay cỏ nón/cây chậu/cây ven đường |
| game/engine.ts | Tích hợp scene, collider, animation và QA |
| tests/visual-structure.test.mjs | Regression geometry, xe, sân, LOD, động vật |

Nhà/sân/cây/động vật là nội dung minh họa có kiểm soát, không phải dữ liệu khảo sát từng vật thể. Giữ graph OSM và cổng hero hiện có. Chưa xác nhận độ chính xác vị trí từng căn nhà/cây.

## C. Test results và vòng sửa

| Kiểm tra | Kết quả |
|---|---|
| TypeScript | PASS |
| Production build | PASS, 5 bước hoàn tất; còn cảnh báo chunk >500 kB |
| Automated tests | **28/28 PASS** — docs/qa/v04-tests.txt |
| Mission/economy/inventory/save/pathfinding | Test hồi quy PASS |
| Rapier ground/wall/road crown | Test hồi quy PASS |
| Tree LOD / active instance budget | PASS ở kiểm tra cấu trúc CPU |
| Batching | PASS: giữ nguyên số tam giác; giữ cây trong từng LOD |
| Xe máy/ô tô | PASS: bánh quay, lái tiến dần về mục tiêu, reset |
| 20 tổ hợp sân | PASS: collider hữu hạn, lối giữa mở |
| Chó/gà | PASS: chuyển động hữu hạn/liên tục, nằm trong phạm vi và culling |
| Browser 0.4 | **BLOCKED**: GL_RENDERER = Disabled; BindToCurrentSequence failed |
| Gameplay/E2E/5 ảnh QA v0.4 | Chưa xác minh thành công |

Vòng 1: thêm module, chạy test. Phát hiện phép đếm cây cộng cả ba LOD, không tương ứng số render; đồng thời log phát hiện batching không ghép được geometry indexed và non-indexed, có thể làm mất chi tiết xe.

Vòng 2: chuẩn hóa geometry trước batching, giữ cây LOD, sửa phép đo số instance đang hoạt động. Thêm test bảo toàn tam giác, xe, sân và động vật. Kết quả 28/28 PASS. Lần chạy browser mới vẫn bị WebGL chặn (08:19 UTC); dừng visual loop, không lặp vô hạn và không vượt tối đa 3 vòng.

Log browser: docs/qa/v04-runtime-errors.json. Build/test CPU không thay thế screenshot hoặc bằng chứng cảm giác điều khiển.

## D. Performance

Vẫn giới hạn 105 nhà; tăng chi tiết quanh nhà, không tuyên bố đã đo được density tăng 3–5 lần. Cây dùng 3 LOD và instancing; nhà vẫn có distance culling, chưa có 3 LOD nhà đầy đủ. Đồ sân phần lớn được batch theo material.

FPS, draw calls, GPU time thực của v0.4: **N/A**. Chỉ số 66/120 FPS trên hai ảnh cũ là thời điểm HUD, không phải benchmark v0.4. Chi tiết mới có thể tăng tải; cần đo trên local/mobile.

## E. Visual scorecard

Điểm dưới đây là nhận xét chủ quan từ hai ảnh v0.3, dùng xếp thứ tự sửa. Không chấm v0.4 bằng code.

| Tiêu chí | Ảnh cổng v0.3 | Ảnh dân cư v0.3 | v0.4 |
|---|---:|---:|---|
| A. Road | 6 | 6 | N/A |
| B. Terrain | 3 | 3 | N/A |
| C. Density | 3 | 4 | N/A |
| D. Architecture | N/A | 4 | N/A |
| E. Materials | 4 | 4 | N/A |
| F. Vegetation | 2 | 2 | N/A |
| G. Lighting | 5 | 5 | N/A |
| H. Atmosphere | 4 | 4 | N/A |
| I. Character | 2 | 2 | N/A |
| J. Vehicle | 2 | 2 | N/A |
| K. Camera composition | 6 | 6 | N/A |
| L. Liveliness | 3 | 2 | N/A |
| M. Background depth | 3 | 2 | N/A |
| N. Overall realism | 3 | 3 | N/A |
| O. Sustained performance | N/A | N/A | N/A |

SHOT-01…05 của bản mới đều chưa có PNG thành công. Không có ảnh mockup/offline thay gameplay. Chưa có evidence để PASS visual gate.

## F. Remaining issues

- Chưa quan sát bản mới trên renderer; silhouette, shader compile, màu sắc và chất lượng bóng vẫn chưa được xác minh.
- Asset vẫn procedural, không phải art final. Chưa có normal/AO texture baked hoặc mocap.
- Chưa có IK giữ tay/chân vào xe. Tiếp xúc khi ngồi xe, cúi người và cua cần review từ bên cạnh/chính diện.
- Động vật chỉ ambient decoration, chưa có collider hoặc AI né vật cản; phạm vi nhỏ được đặt quanh sân/lề.
- Terrain vẫn khá phẳng, hậu cảnh và lighting/AO cần một lượt riêng. Không dùng props để tuyên bố địa hình đã đúng thực tế.
- Chưa đo FPS mobile, chưa có E2E browser thành công cho 0.4.

## G. Chạy local và bước tiếp theo

Giải nén, mở terminal trong thư mục dong-hai-open-world:

```bash
npm ci
npm run dev
```

Mở địa chỉ terminal in ra; footer phải ghi **Village assets 0.4**. Có thể giữ bản lưu: model mới được dựng khi reload, không cần xóa tiến độ.

Thêm `?visualqa=1` trong dev để chọn SHOT-01…05, bấm PNG và Metrics JSON. Giữ cùng độ phân giải/zoom. Bấm “Về màn hình chơi” để thoát đóng băng; kiểm tra WASD, lên/xuống xe, cua, sân và NPC. PNG lấy từ renderer không chứa HUD HTML; muốn cả HUD hãy chụp cửa sổ.

Ưu tiên tiếp theo, tối đa 5:

1. Thu 5 góc mới và review silhouette nhân vật/xe, điểm tiếp xúc tay/chân.
2. Kiểm tra tán lá/cỏ ở gần và các lần chuyển LOD.
3. Kiểm tra sân nhà, góc đường và va chạm mới.
4. Chỉnh lighting, nền xa và khoảng terrain trống từ evidence render.
5. Đo FPS/frame time/draw calls ở khu dân cư trên desktop/mobile.
