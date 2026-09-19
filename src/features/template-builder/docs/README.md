# Huong Dan Kien Truc & Bao Tri Module Template Builder

Module Template Builder cho phep nguoi dung tuy bien Schema du lieu va Template hien thi Flashcard cho tung Topic (theo mo hinh Form Builder).

---

## 1. Tong Quan Nghiep Vu & Luong Du Lieu

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
      v (Nguoi dung bam Save)
[Mappers: client-to-backend]
      |
      v (TemplateElementDTO[], Fork Topic Schema API)
[Backend API]
```

- **Che do Schema Shared**: Mac dinh mot topic moi tao duoc gan voi system schema (`shared: true`). Khi nguoi dung chinh sua va bam "Luu cau hinh", he thong goi mutation `forkTopicSchema` de sao chep schema va template thanh ban ghi rieng cho topic do.
- **Kien truc 2 mat the**: Store quan ly doc lap hai mang `frontSections` (mat truoc) va `backSections` (mat sau). Moi section chua cac `BuilderField`.

---

## 2. Danh Sach & Vai Tro Cac File

### Thu muc goc (`src/features/template-builder/`)

| File | Vai tro |
| :--- | :--- |
| `types.ts` | Dinh nghia toan bo kieu du lieu backend DTO, client model, enums (`DataType`, `SemanticRole`, `CardSide`). |
| `store-types.ts` | Dinh nghia state va signature cac ham trong Zustand store. |
| `store-helpers.ts` | Cac ham tinh toan thuan tuy (pure functions): tao field tu custom input, sinh slug tu label, tao field tu attribute co san. |
| `api.ts` | React Query hooks: `useTopicSchema`, `useSchema`, `useSchemas`, `useForkTopicSchema`. |
| `use-template-builder-store.ts` | Khoi tao Zustand store chinh, compose tu `section-slice` va `field-slice`. |
| `template-builder-screen.tsx` | Man hinh chinh: ket noi API, khoi tao store, render canvas, tab bar va 4 bottom sheets. |

---

### Thu muc `mappers/`

| File | Vai tro |
| :--- | :--- |
| `helpers.ts` | Parse an toan JSON config tu backend, tao cac section mac dinh khi chua co template DTO. |
| `backend-to-client.ts` | Chuyen doi mang phang `TemplateElementDTO[]` va `TopicSchemaDTO` thanh cay `BuilderSection[]` cho hai mat the `FRONT` va `BACK`. |
| `client-to-backend.ts` | Chuyen doi cay `BuilderSection[]` cua hai mat the ve mang phang `TemplateElementDTO[]` phuc vu payload luu API. |
| `mappers.ts` | Barrel export tap trung cho toan bo mapper. |

---

### Thu muc `store/`

| File | Vai tro |
| :--- | :--- |
| `section-slice.ts` | Quan ly cac action ve Section: tao moi, sua ten/so cot/repeatable, xoa section, sap xep thu tu section. |
| `field-slice.ts` | Quan ly cac action ve Field: them field tu preset, tao custom field moi (dong thoi chen vao `schema.groups`), cap nhat style/role/datatype, xoa field. |

---

### Thu muc `components/`

| File | Vai tro |
| :--- | :--- |
| `builder-header.tsx` | Header dau man hinh: nut Back, ten template hien tai, nut mo Preview modal. |
| `tab-segmented-bar.tsx` | Thanh chuyen doi giua mat truoc (`FRONT`) va mat sau (`BACK`), hien thi so luong field moi mat. |
| `section-card.tsx` | The Section tren canvas: hien thi ten section, badge layout cot, nut cai dat section, danh sach field con va nut them field. |
| `field-item-card.tsx` | The hien thi mot field: nhan label, badge kieu du lieu, vi tri cot, trigger mo sheet Field Settings. |
| `field-settings-bottom-sheet.tsx` | Bottom sheet sua field: nhan, kieu du lieu, role, font size, mau sac, can le, toggle required/hideIfEmpty/audio. Co footer co dinh chua nut Xoa va Ap dung. |
| `field-settings-selectors.tsx` | Cac component selector con cho field settings: Font Size, Alignment, Color Picker, Column, Toggles. |
| `field-settings-schema-selectors.tsx` | Cac component selector chon Data Type (`TEXT`, `AUDIO`, `IMAGE`) va Semantic Role (`TARGET_WORD`, `DEFINITION`, ...). |
| `section-settings-bottom-sheet.tsx` | Bottom sheet sua section: doi ten section, chon bo cuc 1 cot / 2 cot, toggle lap lai (repeatable). Su dung `enableDynamicSizing` de vua khit noi dung. |
| `add-field-sheet.tsx` | Bottom sheet them field vao section voi 2 tab: Presets (chon tu schema co san) va Custom (tao thuoc tinh moi). |
| `flashcard-preview-modal.tsx` | Modal mo phong flashcard thuc te, cho phep cham lat the giua mat truoc/sau de kiem tra giao dien truc quan. |
| `template-builder-skeleton.tsx` | Skeleton loader hien thi trong thoi gian API dang tai du lieu. |
| `index.ts` | Barrel export cho toan bo components. |

---

## 3. Cac Diem Luu Y Ky Thuat Khi Bao Tri

1. **Cau hinh Bottom Sheet (@gorhom/bottom-sheet v5)**:
   - Cac sheet co chieu cao co dinh (`AddFieldSheet`, `FieldSettingsBottomSheet`, `FlashcardPreviewModal`) phai co `enableDynamicSizing={false}` va memoize `snapPoints={['85%']}`. Neu thieu `enableDynamicSizing={false}`, Gorhom v5 se tinh sai chieu cao khoi tao va che mat footer nut bam.
   - Sheet `SectionSettingsBottomSheet` co noi dung ngan nen su dung `enableDynamicSizing` (khong set `snapPoints`) ket hop `BottomSheetView` de sheet tu dong om vua khit noi dung, tranh tao khoang trang thua.
   - Luon dat `enableContentPanningGesture={false}` tren cac sheet chua form / thao tac lat the de tranh viec vuot cham tren noi dung lam dong sheet ngoai y muon.

2. **Safe Area Insets o Footer**:
   - Cac footer chua nut hanh dong o day sheet su dung `useSafeAreaInsets()` voi cong thuc `style={{ paddingBottom: Math.max(insets.bottom + 12, 32) }}` de dam bao nut khong bi sat mep duoi hoac che boi Home Bar tren moi loai thiet bi.

3. **Tao Custom Field**:
   - Khi tao custom field, ham `createFieldFromCustomInput` tu dong chuyen doi `label` thanh `attributeName` dang `snake_case` (loai bo dau tieng Viet, ky tu dac biet). Neu trung ten da co, he thong tu dong them 4 ky tu hash vao duoi.
