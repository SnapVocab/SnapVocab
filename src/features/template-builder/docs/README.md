# Hướng Dẫn Kiến Trúc & Bảo Trì Module Template Builder

Module Template Builder cho phép người dùng tùy biến Schema dữ liệu và Template hiển thị Flashcard cho từng Topic (theo mô hình Form Builder kết hợp).

---

## 1. Tổng Quan Nghiệp Vụ & Luồng Dữ Liệu

```
[Backend API]
      |
      v (TopicSchemaDTO, CardTemplateDTO)
[Mappers: backend-to-client]
      |
      v (BuilderSection[], BuilderField[])
[Zustand Store: useTemplateBuilderStore]
      |
      +---> [UI Canvas: SectionCard, FieldItemCard]
      |
      +---> [Bottom Sheets: SectionSettings, FieldSettings, AddField, Preview]
      |
      v (Người dùng bấm Save)
[Mappers: client-to-backend]
      |
      v (TemplateElementDTO[], Fork Topic Schema API)
[Backend API]
```

- **Cơ chế Schema Shared**: Mặc định một topic mới tạo sẽ được gắn với schema hệ thống (`shared: true`). Khi người dùng chỉnh sửa và bấm "Lưu cấu hình", hệ thống sẽ gọi mutation `forkTopicSchema` để sao chép schema và template thành bản ghi riêng cho topic đó.
- **Kiến trúc 2 mặt thẻ**: Store quản lý độc lập hai mảng `frontSections` (mặt trước) và `backSections` (mặt sau). Mỗi section chứa danh sách các `BuilderField`.

---

## 2. Danh Sách & Vai Trò Các File

### Thư mục gốc (`src/features/template-builder/`)

| File | Vai trò |
| :--- | :--- |
| `types.ts` | Định nghĩa toàn bộ kiểu dữ liệu backend DTO, client model, enums (`DataType`, `SemanticRole`, `CardSide`). |
| `store-types.ts` | Định nghĩa state và chữ ký các hàm trong Zustand store. |
| `store-helpers.ts` | Các hàm tính toán thuần túy (pure functions): tạo field từ custom input, sinh slug từ label, tạo field từ attribute có sẵn. |
| `api.ts` | React Query hooks: `useTopicSchema`, `useSchema`, `useSchemas`, `useForkTopicSchema`. |
| `use-template-builder-store.ts` | Khởi tạo Zustand store chính, ghép nối từ `section-slice` và `field-slice`. |
| `template-builder-screen.tsx` | Màn hình chính: kết nối API, khởi tạo store, render canvas, tab bar và 4 bottom sheets. |

---

### Thư mục `mappers/`

| File | Vai trò |
| :--- | :--- |
| `helpers.ts` | Parse an toàn JSON config từ backend, tạo các section mặc định khi chưa có template DTO. |
| `backend-to-client.ts` | Chuyển đổi mảng phẳng `TemplateElementDTO[]` và `TopicSchemaDTO` thành cây `BuilderSection[]` cho hai mặt thẻ `FRONT` và `BACK`. |
| `client-to-backend.ts` | Chuyển đổi cây `BuilderSection[]` của hai mặt thẻ về mảng phẳng `TemplateElementDTO[]` phục vụ payload lưu API. |
| `mappers.ts` | Barrel export tập trung cho toàn bộ mapper. |

---

### Thư mục `store/`

| File | Vai trò |
| :--- | :--- |
| `section-slice.ts` | Quản lý các action về Section: tạo mới, sửa tên/số cột/repeatable, xóa section, sắp xếp thứ tự section. |
| `field-slice.ts` | Quản lý các action về Field: thêm field từ preset, tạo custom field mới (đồng thời chèn vào `schema.groups`), cập nhật style/role/datatype, xóa field. |

---

### Thư mục `components/`

| File | Vai trò |
| :--- | :--- |
| `builder-header.tsx` | Header đầu màn hình: nút Back, tên template hiện tại, nút mở Preview modal. |
| `tab-segmented-bar.tsx` | Thanh chuyển đổi giữa mặt trước (`FRONT`) và mặt sau (`BACK`), hiển thị số lượng field mỗi mặt. |
| `section-card.tsx` | Thẻ Section trên canvas: hiển thị tên section, badge layout cột, nút cài đặt section, danh sách field con và nút thêm field. |
| `field-item-card.tsx` | Thẻ hiển thị một field: nhãn label, badge kiểu dữ liệu, vị trí cột, trigger mở sheet Field Settings. |
| `field-settings-bottom-sheet.tsx` | Bottom sheet sửa field: nhãn, kiểu dữ liệu, role, font size, màu sắc, căn lề, toggle required/hideIfEmpty/audio. Có footer cố định chứa nút Xóa và Áp dụng. |
| `field-settings-selectors.tsx` | Các component selector con cho field settings: Font Size, Alignment, Color Picker, Column, Toggles. |
| `field-settings-schema-selectors.tsx` | Các component selector chọn Data Type (`TEXT`, `AUDIO`, `IMAGE`) và Semantic Role (`TARGET_WORD`, `DEFINITION`, ...). |
| `section-settings-bottom-sheet.tsx` | Bottom sheet sửa section: đổi tên section, chọn bố cục 1 cột / 2 cột, toggle lặp lại (repeatable). Sử dụng `enableDynamicSizing` để vừa khít nội dung. |
| `add-field-sheet.tsx` | Bottom sheet thêm field vào section với 2 tab: Presets (chọn từ schema có sẵn) và Custom (tạo thuộc tính mới). |
| `flashcard-preview-modal.tsx` | Modal mô phỏng flashcard thực tế, cho phép chạm lật thẻ giữa mặt trước/sau để kiểm tra giao diện trực quan. |
| `template-builder-skeleton.tsx` | Skeleton loader hiển thị trong thời gian API đang tải dữ liệu. |
| `index.ts` | Barrel export cho toàn bộ components. |

---

## 3. Các Điểm Lưu Ý Kỹ Thuật Khi Bảo Trì

1. **Cấu hình Bottom Sheet (@gorhom/bottom-sheet v5)**:
   - Các sheet có chiều cao cố định (`AddFieldSheet`, `FieldSettingsBottomSheet`, `FlashcardPreviewModal`) phải có `enableDynamicSizing={false}` và memoize `snapPoints={['85%']}`. Nếu thiếu `enableDynamicSizing={false}`, Gorhom v5 sẽ tính sai chiều cao khởi tạo ban đầu và che mất footer nút bấm.
   - Sheet `SectionSettingsBottomSheet` có nội dung ngắn nên sử dụng `enableDynamicSizing` (không đặt `snapPoints`) kết hợp `BottomSheetView` để sheet tự động ôm vừa khít nội dung, tránh tạo khoảng trắng thừa.
   - Luôn đặt `enableContentPanningGesture={false}` trên các sheet chứa form hoặc thao tác lật thẻ để tránh việc vuốt chạm trên nội dung làm đóng sheet ngoài ý muốn.

2. **Safe Area Insets ở Footer**:
   - Các footer chứa nút hành động ở đáy sheet sử dụng `useSafeAreaInsets()` với công thức `style={{ paddingBottom: Math.max(insets.bottom + 12, 32) }}` để đảm bảo nút không bị sát mép dưới hoặc bị che bởi Home Bar trên mọi loại thiết bị.

3. **Tạo Custom Field**:
   - Khi tạo custom field, hàm `createFieldFromCustomInput` tự động chuyển đổi `label` thành `attributeName` dạng `snake_case` (loại bỏ dấu tiếng Việt, ký tự đặc biệt). Nếu trùng tên đã có, hệ thống tự động thêm 4 ký tự hash vào đuôi.
