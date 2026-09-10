# Đông Hải v0.2 — Village Rebuild

## Đã triển khai

- Cảnh quan: thay núi hình nón bằng dải đồi có lưới địa hình và normal liên tục; Sky dùng tán xạ khí quyển; giảm ánh sáng nền và exposure để giữ độ tương phản.
- Vật liệu shader thủ tục: đường có hạt và mảng vá màu, đất có biến thiên, tường vữa, mái ngói có đường ron, sân lát và gợn màu mặt nước. Không dùng texture lấy từ Google.
- Làng: 105 nhà minh họa theo đường OSM, một/two tầng, cửa chớp, cửa bên hông, hiên, bậc cửa, ban công, sân lát, chậu cây và một số giàn hoa giấy. Dùng khoảng cách tới đường và góc nhà để loại placement lấn đường; mỗi nhà có collider.
- Cây: thay tán cầu lớn bằng cụm lá instancing, thêm nhánh cây và lá dừa; cỏ ven đường gom theo cell.
- Hiệu năng: gộp mesh tĩnh của từng nhà theo material, instancing lá/cỏ, giữ bật/tắt house chunk theo khoảng cách. Chưa phải streaming giải phóng tài nguyên thực.
- Nhân vật người chơi: SkinnedMesh gốc do dự án tự dựng, 12 xương, màu vertex, trang phục/ba lô, khuỷu tay, đầu gối, mặt và bàn tay; clip idle/walk/run/ride/air và crossfade 0,2 giây. Đây là nhân vật stylized, chưa phải model người chân thực như concept. NPC và model xe vẫn còn cần nâng cấp riêng.
- Di chuyển: tăng/giảm tốc, xoay theo cung ngắn, nội suy vị trí và hướng giữa các bước physics cho người chơi và xe. Tốc độ animation dựa trên quãng đường di chuyển thực.
- HUD desktop: thu nhỏ thương hiệu, bảng nhiệm vụ, minimap và bảng xe; tăng một số cỡ chữ; giảm lớp vignette.
- Phím P / nút trong Cài đặt xuất ảnh PNG cảnh 3D ngay trên máy local. Ảnh lấy trực tiếp từ renderer, không gồm HUD HTML. Dùng screenshot của hệ điều hành nếu cần cả HUD.

## Dữ liệu và giới hạn

RoadGraph và POI được giữ nguyên. Nhà, cây trang trí, đồi và vật liệu mới là nội dung minh họa do code dựng, không phải footprint/địa hình đã đo. Không tự nhận world đã đúng hoàn toàn Đông Hải. Cổng chưa là hero asset đã nghiệm thu. Mặt nước mới có chi tiết màu, chưa có phản xạ thật hoặc sóng chuyển động.

Không có asset người tải từ bên thứ ba trong bản này. Mô hình người gốc cải thiện rig và chuyển động nhưng chưa thay thế bước sản xuất model/texture chất lượng cao.

## Kết quả kiểm tra

- TypeScript: PASS, exit 0.
- Build production: PASS, exit 0. Còn cảnh báo JS chunk >500 kB.
- Test: 19/19 PASS (`qa/v02-tests.txt`).
- Fixture toàn làng: tạo 105 nhà có collider tương ứng.
- Test mới: gia tốc ổn định ở 30/60/120Hz; xoay qua ±PI; 12 xương và transform finite trong mọi clip; mesh batching giảm số mesh; normals địa hình finite; instancing nằm trong giới hạn.
- Không có phiên browser 3D chạy thành công trong lượt này. WebGL browser được cấp đã bị chặn ở các lượt trước; không có ảnh mới để khẳng định visual PASS.
- FPS mobile, chất lượng hình ảnh, camera clipping và toàn nhiệm vụ qua UI: CHƯA KIỂM CHỨNG.

Các test hình học chạy qua Three.js và Rapier trong Node, không giả lập kết quả screenshot hay xác nhận shader đã compile trên GPU. Tổng thể: **IMPLEMENTED / VISUAL ACCEPTANCE PENDING**.

## Loop sửa có điểm dừng

Vòng 1: dựng cảnh + rig + motion; phát hiện và sửa lỗi cú pháp lũy thừa trong địa hình.
Vòng 2: gộp mesh, thêm kiểm tra toàn làng, bổ sung nội suy xe; typecheck/test/build đạt.
Dừng nhánh kỹ thuật khi đủ bằng chứng trên. Nhánh visual dừng vì thiếu WebGL khả dụng; không đổi gate visual thành unit test.
Tối đa 3 vòng mỗi hạng mục; nếu 2 vòng liên tiếp không cải thiện hoặc thiếu dữ liệu/môi trường thì ghi blocker và dừng.

## Chạy bản mới

Giải nén vào thư mục mới để giữ nguyên bản cũ. Chạy `npm ci`, `npm run dev`, mở URL terminal in ra. Kiểm tra footer có “Village rebuild 0.2”. Bản lưu v1 vẫn đọc được.

Để kiểm tra cảnh khởi đầu: chọn chơi lại từ đầu chỉ khi muốn thay tiến độ local; nếu muốn giữ save, dùng Cài đặt → Về cổng. Đi vào khu dân cư để xem nhà mới. Nhấn P ở cổng, khu nhà, lúc đi bộ và trên xe; quay video 10–15 giây để đánh giá độ mượt. Cần đối chiếu ảnh trên cùng máy, cùng camera, cùng ánh sáng để chấm visual.
