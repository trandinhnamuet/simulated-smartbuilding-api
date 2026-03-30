# 🚀 Cách Mở Swagger UI Locally

## 🎯 Giải Pháp Đợc Chọn

Mình đã integrate **Swagger UI trực tiếp vào NestJS app**. Không cần setup phức tạp, chỉ cần chạy app bình thường!

---

## 📖 Cách Sử Dụng

### **Cách 1: Chạy App Bình Thường (Easiest)**

**Windows:**
```bash
npm start
# Truy cập: http://localhost:3000/docs
```

**Hoặc dùng batch script:**
```bash
# Double-click: start-api.bat
# Sẽ auto start API + mở Swagger UI trong browser
```

**Mac/Linux:**
```bash
npm start
# Truy cập: http://localhost:3000/docs
```

---

### **Cách 2: Chạy với Port Custom**

Nếu port 3000 bị busy:
```bash
# Windows PowerShell
$env:PORT=3001; npm start
# Truy cập: http://localhost:3001/docs

# Windows CMD
set PORT=3001 && npm start

# Mac/Linux
PORT=3001 npm start
```

---

### **Cách 3: Production Build + Run**

```bash
npm run build        # Compile TypeScript → dist/
PORT=3001 npm run start:prod  # Run compiled app

# Truy cập: http://localhost:3001/docs
```

---

## 🔗 Swagger UI Endpoints

Khi app chạy, bạn có access đến:

| Endpoint | Mục đích |
|----------|---------|
| `/docs` | 📖 **Swagger UI** (Interactive documentation) |
| `/api-json` | 📋 API spec dạng JSON |
| `/api-yaml` | 📋 API spec dạng YAML |
| `/api/v1/*` | 🔧 Actual API endpoints |

---

## ✨ Swagger UI Features

Swagger UI auto-generated từ NestJS có:

- ✅ Interactive endpoint explorer
- ✅ Try-it-out feature (test endpoints directly)
- ✅ Request/response schema visualization  
- ✅ Parameter validation hints
- ✅ Authentication fields (nếu cần)
- ✅ Download spec (JSON/YAML)
- ✅ Code generation (curl, JavaScript, Python, etc.)

---

## 🎮 Test Endpoints từ Swagger UI

1. Mở **http://localhost:3000/docs**
2. Click endpoint (e.g., `GET /api/v1/machines`)
3. Nhấn **Try it out**
4. Nhập parameters (nếu có)
5. Nhấn **Execute**
6. Xem response + curl command

---

## 🔗 Static OpenAPI File

Ngoài Swagger UI tích hợp sẵn, bạn cũng có file OpenAPI spec:

**`docs/openapi/openapi.yaml`** — Main OpenAPI specification (1,800+ lines)

Có thể:
- Upload lên https://editor.swagger.io
- View trong ReDoc (https://redocly.com/redoc)
- Dùng để generate client SDK
- Import vào Postman

---

## 📦 Development Workflow

```bash
# 1. Start dev server (hot-reload)
npm run start:dev
# Truy cập: http://localhost:3000/docs

# 2. Make code changes (e.g., add endpoint)
# → Auto-recompiles

# 3. Swagger UI auto-updates!
# → Refresh browser, thấy new endpoint
```

---

## 🆘 Troubleshooting

### **Port 3000 already in use**
```bash
# Windows - kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### **Swagger not showing up**

1. Check if app started: `npm start` terminal shows:
   ```
   🏭 Smart Building API running on http://localhost:3000
   📖 Swagger Docs available at http://localhost:3000/docs
   ```

2. Clear browser cache: `Ctrl+Shift+Delete`

3. Check console errors: Open browser dev tools (`F12`)

### **Changes not reflected in Swagger**

- Rebuild: `npm run build`
- App must restart to pick up changes
- Use `npm run start:dev` for auto-reload

---

## 📚 Additional Resources

- **OpenAPI Spec**: `docs/openapi/openapi.yaml`
- **Postman Collection**: `docs/openapi/Smart-Building-API.postman_collection.json`
- **API Reference**: `docs/openapi/ENDPOINTS.md`
- **Startup Script**: `start-api.bat` (Windows)

---

## 🎯 Quick Start Cheat Sheet

```bash
# Install deps
npm install

# Start API with Swagger UI
npm start
# → Open http://localhost:3000/docs in browser

# Dev mode (auto-reload)
npm run start:dev

# Run with custom port
PORT=3001 npm start
# → Open http://localhost:3001/docs

# Build for production
npm run build

# Run production build
npm run start:prod
```

---

## ✅ Done!

Bạn đã có Swagger UI running locally! 🎉

- Không cần upload lên online
- Không cần Docker
- Just run `npm start` and go to `/docs` 📖

Enjoy! 🚀
