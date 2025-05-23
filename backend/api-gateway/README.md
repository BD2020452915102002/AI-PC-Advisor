# API Gateway - AI PC Advisor

API Gateway cho hệ thống AI PC Advisor - nền tảng thương mại điện tử linh kiện máy tính.

## Tổng quan

API Gateway đóng vai trò là điểm truy cập duy nhất cho client, chịu trách nhiệm định tuyến các request đến các microservice tương ứng, xác thực và phân quyền tập trung.

## Tính năng chính

- Định tuyến request đến các microservice
- Xác thực và phân quyền tập trung qua Keycloak
- Rate limiting để chống tấn công DDoS
- Caching với Redis
- Logging và monitoring
- Kiểm soát lỗi và timeout
- Proxy request

## Cấu trúc thư mục

```
api-gateway/
├── src/
│   ├── config/         # Cấu hình Keycloak, Redis
│   ├── controllers/    # Controller (nếu cần)
│   ├── middlewares/    # Middleware xác thực, validate, xử lý lỗi
│   ├── routes/         # Định nghĩa API routes
│   ├── utils/          # Tiện ích như logger
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
- Redis
- Keycloak (cho xác thực)
- Các microservice cần định tuyến

### Cài đặt

1. Clone repository
```bash
git clone <repository-url>
cd backend/api-gateway
```

2. Cài đặt dependencies
```bash
npm install
```

3. Tạo file .env từ .env.example và điền thông tin cần thiết
```bash
cp .env.example .env
```

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

## Cấu hình các Microservice

API Gateway định tuyến đến các microservice sau:

1. User Service (`/api/users`) - Quản lý người dùng, xác thực
2. Product Service (`/api/products`) - Quản lý sản phẩm
3. Category Service (`/api/categories`) - Quản lý danh mục sản phẩm
4. Brand Service (`/api/brands`) - Quản lý thương hiệu
5. Specification Service (`/api/specifications`) - Quản lý đặc tính kỹ thuật
6. Cart Service (`/api/cart`) - Quản lý giỏ hàng
7. Order Service (`/api/orders`) - Quản lý đơn hàng

## Phát triển

### Thêm Microservice mới

Để thêm một microservice mới, hãy làm theo các bước sau:

1. Cập nhật file `.env` với URL của service mới
2. Thêm proxy middleware trong file `src/index.js`:

```javascript
// New Service
app.use('/api/new-service', createProxyMiddleware({
  target: process.env.NEW_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/new-service': '/api/new-service'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000
}));
``` 