# NGINX và Redis cho User Service

Tài liệu này hướng dẫn cách cài đặt và cấu hình NGINX và Redis cho User Service.

## Cài đặt và Chạy với Docker Compose

Cách đơn giản nhất để cài đặt và chạy NGINX và Redis là sử dụng Docker Compose:

```bash
cd backend/user-service
docker-compose up -d
```

Sau khi chạy lệnh này, ba service sẽ được khởi động:
- **user-service**: Ứng dụng Node.js chạy trên cổng 3000 (nội bộ)
- **nginx**: NGINX reverse proxy chạy trên cổng 8080 (có thể truy cập từ bên ngoài)
- **redis**: Redis server chạy trên cổng 6379

## Cài đặt Thủ công

### Redis

1. Cài đặt Redis:
   ```bash
   # Trên Ubuntu/Debian
   sudo apt update
   sudo apt install redis-server
   
   # Trên Windows, tải về từ https://github.com/microsoftarchive/redis/releases
   
   # Trên macOS
   brew install redis
   ```

2. Khởi động Redis:
   ```bash
   # Trên Ubuntu/Debian
   sudo systemctl start redis-server
   
   # Trên Windows
   redis-server
   
   # Trên macOS
   brew services start redis
   ```

3. Cấu hình biến môi trường cho ứng dụng:
   ```
   REDIS_URL=redis://localhost:6379
   ```

### NGINX

1. Cài đặt NGINX:
   ```bash
   # Trên Ubuntu/Debian
   sudo apt update
   sudo apt install nginx
   
   # Trên Windows, tải về từ http://nginx.org/en/download.html
   
   # Trên macOS
   brew install nginx
   ```

2. Sao chép file cấu hình:
   ```bash
   # Trên Ubuntu/Debian
   sudo cp backend/user-service/nginx/nginx.conf /etc/nginx/nginx.conf
   
   # Trên Windows
   copy backend\user-service\nginx\nginx.conf C:\nginx\conf\nginx.conf
   
   # Trên macOS
   cp backend/user-service/nginx/nginx.conf /usr/local/etc/nginx/nginx.conf
   ```

3. Khởi động NGINX:
   ```bash
   # Trên Ubuntu/Debian
   sudo systemctl restart nginx
   
   # Trên Windows
   nginx -s reload
   
   # Trên macOS
   brew services restart nginx
   ```

## Sử dụng Redis trong Ứng dụng

Mã sử dụng Redis đã được thêm vào `src/config/redis.js`. Để sử dụng Redis trong controller hoặc service, bạn có thể import như sau:

```javascript
const { getAsync, setAsync, delAsync } = require('../config/redis');

// Ví dụ cách sử dụng
async function getUserById(id) {
  // Thử lấy từ cache trước
  const cachedUser = await getAsync(`user:${id}`);
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }
  
  // Nếu không có trong cache, truy vấn database
  const user = await User.findByPk(id);
  
  // Lưu vào cache (expire sau 1 giờ)
  if (user) {
    await setAsync(`user:${id}`, JSON.stringify(user), 'EX', 3600);
  }
  
  return user;
}
```

## Cấu Hình

### Redis Configuration

File `src/config/redis.js` chứa cấu hình Redis. Bạn có thể thay đổi URL kết nối Redis bằng cách chỉnh sửa biến môi trường `REDIS_URL`.

### NGINX Configuration

File `nginx/nginx.conf` chứa cấu hình NGINX. Bạn có thể điều chỉnh:
- Cổng (port) - mặc định là 80 (nội bộ), map ra 8080 trong docker-compose
- Server name - mặc định là `user-service.example.com`
- Giới hạn tốc độ (rate limiting) - mặc định là 5 request/giây
- Cấu hình proxy pass - mặc định trỏ đến `http://localhost:3000` 