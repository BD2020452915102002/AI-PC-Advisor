# Product Service - AI PC Advisor

Microservice quản lý sản phẩm cho hệ thống AI PC Advisor - nền tảng thương mại điện tử linh kiện máy tính.

## Tổng quan

Product Service quản lý toàn bộ sản phẩm, danh mục, thương hiệu và đặc tính kỹ thuật trong hệ thống. Service được xây dựng trên nền tảng Node.js, Express.js và PostgreSQL.

## Tính năng chính

- Quản lý sản phẩm: thêm, sửa, xóa, tìm kiếm
- Quản lý danh mục: cây danh mục phân cấp đa tầng
- Quản lý thương hiệu
- Quản lý đặc tính kỹ thuật sản phẩm
- Upload và quản lý hình ảnh sản phẩm (tích hợp Cloudinary)
- Caching với Redis
- Giao tiếp giữa các service qua RabbitMQ
- Xác thực qua Keycloak

## Cấu trúc thư mục

```
product-service/
├── src/
│   ├── config/         # Cấu hình database, Keycloak, Redis, RabbitMQ
│   ├── controllers/    # Xử lý logic nghiệp vụ
│   ├── middlewares/    # Middleware xác thực, validate, xử lý lỗi
│   ├── models/         # Mô hình dữ liệu
│   ├── routes/         # Định nghĩa API routes
│   ├── services/       # Business services
│   ├── utils/          # Tiện ích
│   └── index.js        # Entry point
├── logs/               # Log files
├── .env                # Biến môi trường
├── .env.example        # Mẫu file .env
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
└── package.json        # Dependencies
```

## Cài đặt và chạy

### Yêu cầu

- Node.js 18+
- PostgreSQL
- Redis
- RabbitMQ
- Keycloak (cho xác thực)

### Cài đặt

1. Clone repository
```bash
git clone <repository-url>
cd backend/product-service
```

2. Cài đặt dependencies
```bash
npm install
```

3. Tạo file .env từ .env.example
```bash
cp .env.example .env
```

4. Cập nhật thông tin trong file .env

### Chạy ứng dụng

1. Development mode
```bash
npm run dev
```

2. Production mode
```bash
npm start
```

### Sử dụng Docker

```bash
docker-compose up -d
```

## API Endpoints

### Sản phẩm
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- `GET /api/products/slug/:slug` - Lấy sản phẩm theo slug
- `POST /api/products` - Tạo sản phẩm mới (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)
- `POST /api/products/:id/images` - Upload ảnh sản phẩm (Admin)
- `DELETE /api/products/:id/images/:imageId` - Xóa ảnh sản phẩm (Admin)
- `POST /api/products/:id/specifications` - Cập nhật đặc tính kỹ thuật (Admin)

### Danh mục
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/:id` - Lấy danh mục theo ID
- `GET /api/categories/slug/:slug` - Lấy danh mục theo slug
- `POST /api/categories` - Tạo danh mục mới (Admin)
- `PUT /api/categories/:id` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/:id` - Xóa danh mục (Admin)

### Thương hiệu
- `GET /api/brands` - Lấy danh sách thương hiệu
- `GET /api/brands/:id` - Lấy thương hiệu theo ID
- `GET /api/brands/slug/:slug` - Lấy thương hiệu theo slug
- `POST /api/brands` - Tạo thương hiệu mới (Admin)
- `PUT /api/brands/:id` - Cập nhật thương hiệu (Admin)
- `DELETE /api/brands/:id` - Xóa thương hiệu (Admin)
- `POST /api/brands/:id/logo` - Upload logo thương hiệu (Admin)

### Đặc tính kỹ thuật
- `GET /api/specifications` - Lấy danh sách đặc tính kỹ thuật
- `GET /api/specifications/:id` - Lấy đặc tính kỹ thuật theo ID
- `GET /api/specifications/category/:categoryId` - Lấy đặc tính kỹ thuật theo danh mục
- `POST /api/specifications` - Tạo đặc tính kỹ thuật mới (Admin)
- `PUT /api/specifications/:id` - Cập nhật đặc tính kỹ thuật (Admin)
- `DELETE /api/specifications/:id` - Xóa đặc tính kỹ thuật (Admin) 