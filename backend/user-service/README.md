# User Service

User Service là một microservice xử lý quản lý người dùng, thông tin cá nhân và địa chỉ cho hệ thống AI-PC-Advisor E-commerce.

## Công nghệ sử dụng

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- Keycloak (xác thực và phân quyền)
- Winston (logging)

## Cài đặt

1. Clone repository
2. Cài đặt dependencies:

```bash
cd user-service
yarn install
```

3. Tạo file `.env` từ `.env.example`:

```bash
cp env.example .env
```

4. Cấu hình các biến môi trường trong file `.env`
5. Tạo database PostgreSQL
6. Chạy ứng dụng:

```bash
# Development mode
yarn dev

# Production mode
yarn start
```

## Cấu trúc dự án

```
src/
├── config/           # Cấu hình database, Keycloak, etc.
├── controllers/      # Xử lý logic nghiệp vụ
├── middlewares/      # Middlewares (auth, error handling, etc.)
├── models/           # Sequelize models
├── routes/           # API routes
├── services/         # Các service giao tiếp với bên thứ 3
├── utils/            # Utilities và helpers
└── index.js          # Entry point
```

## API Endpoints

### User API

- `POST /api/users/sync` - Đồng bộ thông tin người dùng từ Keycloak
- `GET /api/users/me` - Lấy thông tin người dùng hiện tại
- `PUT /api/users/me` - Cập nhật thông tin người dùng hiện tại
- `GET /api/users` - Lấy danh sách tất cả người dùng (chỉ admin)
- `GET /api/users/:id` - Lấy thông tin người dùng theo ID
- `PUT /api/users/:id` - Cập nhật thông tin người dùng
- `PUT /api/users/:id/deactivate` - Vô hiệu hóa tài khoản người dùng

### Profile API

- `GET /api/profiles/me` - Lấy thông tin profile người dùng hiện tại
- `PUT /api/profiles/me` - Cập nhật profile người dùng hiện tại
- `GET /api/profiles/users/:userId` - Lấy profile người dùng theo user ID
- `PUT /api/profiles/users/:userId` - Cập nhật profile người dùng
- `POST /api/profiles/users/:userId/avatar` - Cập nhật ảnh đại diện

### Address API

- `GET /api/addresses/users/:userId` - Lấy tất cả địa chỉ của người dùng
- `POST /api/addresses/users/:userId` - Thêm địa chỉ mới cho người dùng
- `GET /api/addresses/:id` - Lấy thông tin địa chỉ theo ID
- `PUT /api/addresses/:id` - Cập nhật địa chỉ
- `DELETE /api/addresses/:id` - Xóa địa chỉ
- `PUT /api/addresses/:id/default` - Đặt địa chỉ làm mặc định 