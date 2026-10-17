# Project Instructions: cpacalc (GPA/CPA Calculator & Scheduler)

Ứng dụng web hỗ trợ sinh viên đại học (đặc biệt Đại học Bách Khoa Hà Nội - HUST) tính toán điểm GPA/CPA, lập kế hoạch tiến độ tốt nghiệp, dự đoán điểm và tự động sắp xếp thời khóa biểu không trùng lịch từ file Excel đào tạo.

## Tech Stack
- **Frontend**: React 18.3, TypeScript 5.8, Vite 5.4, Tailwind CSS 3.4, shadcn/ui (Radix UI), Lucide Icons, Recharts
- **State & Data**: TanStack React Query v5, Context API (`AuthContext`), `idb-keyval` (IndexedDB caching)
- **Backend / BaaS**: Supabase (PostgreSQL 16, Auth, Row Level Security)
- **Excel & Scheduling**: `xlsx` (SheetJS), Web Worker (`solver.worker.ts`) với thuật toán quay lui (backtracking) & bitmask 52 tuần
- **Testing**: Vitest 2.1, jsdom

## Commands
- Run dev server: `bun run dev` hoặc `npm run dev` (Vite)
- Run tests: `bun run test --run` hoặc `npm test -- --run`
- Build for production: `bun run build`
- Build for dev: `bun run build:dev`
- Lint code: `bun run lint`

## Project Structure
- `src/pages/`: 5 màn hình chính (`Index` - Tính GPA/CPA, `CoursePlanner` - Lập kế hoạch môn/tốt nghiệp, `Predictor` - Giả lập điểm CPA, `Scheduler` - Xếp TKB tự động, `Auth` - Đăng nhập/Đăng ký theo MSSV)
- `src/components/`: Component giao diện chia theo module (`planner/`, `predictor/`, `scheduler/`, `ui/`)
- `src/hooks/`: Custom hooks kết nối Cloud & Local (`useSemestersCloud`, `usePlannerCloud`, `useScheduler`, `usePredictor`)
- `src/utils/`: Logic tính toán cốt lõi (`gpaCalculator.ts`) và bộ giải xếp lịch (`tkb/solver.ts`, `tkb/conflict.ts`, `tkb/parseExcel.ts`)
- `src/data/`: Dữ liệu khung chương trình đào tạo mẫu (`curriculumData.ts`)
- `src/contexts/`: Quản lý phiên xác thực Supabase (`AuthContext.tsx`)
- `supabase/migrations/`: Lược đồ CSDL và các chính sách RLS

## Code & Naming Conventions
- Component: PascalCase (`SemesterCard.tsx`, `SolverProgress.tsx`)
- Hooks: camelCase tiền tố `use` (`useSemestersCloud.ts`)
- Types & Interfaces: Định nghĩa tập trung tại `src/types/` (`gpa.ts`, `curriculum.ts`, `scheduler.ts`)
- Quy tắc commit: Conventional Commits (`feat(...)`, `fix(...)`, `refactor(...)`)

## Boundaries & Important Notes
- Không xóa nhầm logic tính toán thang điểm chữ và điểm hệ 4 tại `gpaCalculator.ts`.
- Thuật toán TKB chạy trên Web Worker để tránh đơ giao diện chính; mọi cấu trúc truyền qua worker message phải serialize được.
- Đăng nhập sử dụng MSSV ánh xạ thành email giả lập `<mssv>@student.gpa.local` trên Supabase Auth.
- Luôn kiểm tra RLS policy khi thêm bảng mới trong Supabase.
