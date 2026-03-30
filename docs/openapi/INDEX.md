# API Documentation - File Index

```
docs/openapi/
├── openapi.yaml                           # Main OpenAPI 3.0 spec (1,800+ lines)
├── Smart-Building-API.postman_collection.json  # Postman collection for testing
├── validate-openapi.js                    # Node.js script to validate spec
├── README.md                              # Quick start guide
└── INDEX.md                               # This file
```

## 📄 Files

### 1. **openapi.yaml** — *Main Specification*
- **Format**: OpenAPI 3.0.0 (YAML)
- **Size**: ~1,800 lines
- **Contains**:
  - ✅ 30+ endpoints across 5 modules
  - ✅ Request/Response schemas with examples
  - ✅ Reusable components (schemas, responses)
  - ✅ Server definitions (local + production)
  - ✅ Error handling with standard HTTP codes
  - ✅ Full inline documentation

**Usage**:
- Import into Swagger UI / ReDoc for interactive exploration
- Use with code generators (OpenAPI Generator, AutoRest)
- Reference in API documentation
- Share with frontend teams

---

### 2. **Smart-Building-API.postman_collection.json** — *Testing Collection*
- **Format**: Postman 2.1 Collection JSON
- **Contains**: 
  - 📦 25+ pre-configured request templates
  - 🔗 Variables for `host`, `machineId`, `roomId`, `recordId`
  - 📋 Organized by module (Machines, Sensor Readings, Maintenance, Rooms, Env Readings)
  - 💾 Request/response examples

**Usage**:
1. Open Postman
2. Click **Import** → **Upload Files** → select `.postman_collection.json`
3. Set variables in **Environment** or **Manage Environments**
4. Test endpoints with pre-configured requests

**Variables to configure**:
```
host      → http://localhost:3000        # API base URL
machineId → [UUID of a machine]          # Copy from GET /api/v1/machines
roomId    → [UUID of a room]             # Copy from GET /api/v1/rooms
recordId  → [ID of maintenance record]   # Copy from GET maintenance
```

---

### 3. **validate-openapi.js** — *Validation Script*
- **Format**: Node.js executable
- **Function**: Validates OpenAPI spec structure and displays statistics
- **Output**: Endpoint count by module, component summary, validation checks

**Usage**:
```bash
# Run with default path (openapi.yaml in same directory)
node validate-openapi.js

# Run with specific file path
node validate-openapi.js /path/to/openapi.yaml
```

**Prerequisites**:
```bash
npm install js-yaml
```

**Output Example**:
```
📋 Validating OpenAPI specification...
✅ OpenAPI Version: 1.0.0
✅ Title: Smart Building & Industrial IoT API

📊 Statistics:
   Total Paths: 23
   Total Endpoints: 30
   Total Schemas: 18

🏷️  Endpoints by Tag:
   MACHINES (5)
      📖 GET  /api/v1/machines
      ✍️  POST  /api/v1/machines
      ...
```

---

### 4. **README.md** — *Quick Start Guide*
- Installation instructions for Swagger UI / ReDoc
- Example cURL requests
- Data model descriptions
- Enum values and validation rules
- Testing workflow

---

## 🚀 Quick Start

### Visualize in Swagger UI (Online)
1. Go to https://editor.swagger.io/
2. Click **File** → **Import File** → upload `openapi.yaml`
3. Explore endpoints with descriptions, schemas, examples

### Test with Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import `Smart-Building-API.postman_collection.json`
3. Set environment variables
4. Send test requests

### Generate Code
```bash
# Using OpenAPI Generator (Java)
docker run --rm \
  -v $(pwd):/local openapitools/openapi-generator-cli generate \
  -i /local/openapi.yaml \
  -g typescript-axios \
  -o /local/generated-client

# Using Swagger Codegen
# Or any other OpenAPI-compliant generator
```

---

## 📋 API Modules & Endpoint Count

| Module | Endpoints | Operations |
|--------|-----------|-----------|
| **Machines** | 5 | POST, GET, PATCH |
| **Sensor Readings** | 5 | GET (list, latest, live, historic), POST (generate), GET (anomalies) |
| **Maintenance Records** | 3 | POST (create), GET (list, by ID) |
| **Rooms** | 3 | POST, GET (list), GET (by ID) |
| **Environmental Readings** | 7 | GET (list, latest, live, snapshot, occupied, high-co2), POST (generate) |
| **TOTAL** | **23 paths** | **30 endpoints** |

---

## 🔗 Component Statistics

| Component Type | Count |
|---|---|
| Schemas (Request/Response) | 18 |
| Enums (Inline) | 3 (MachineType, MaintenanceType, RoomType) |
| Response Templates | 3 (BadRequest, NotFound, InternalServerError) |
| Tags | 5 (by module) |
| Servers | 2 (local dev, production) |

---

## 📚 How to Use

### For API Consumers (Frontend/Integration)
1. **Read** `README.md` for overview
2. **Explore** `openapi.yaml` in Swagger UI
3. **Form requests** using Postman collection
4. **Reference** data models and error codes

### For API Developers
1. **Maintain** `openapi.yaml` in sync with controllers
2. **Run** `validate-openapi.js` in CI/CD pipeline
3. **Export** to ReDoc for documentation site
4. **Generate** server stubs or client SDKs

### For QA / Testers
1. **Import** Postman collection
2. **Set up** environment variables
3. **Execute** test workflows
4. **Document** findings with examples

---

## 🔄 Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Validate OpenAPI
  run: |
    npm install js-yaml
    node docs/openapi/validate-openapi.js

- name: Generate API Docs
  run: |
    docker run -v $(pwd):/local swaggerapi/swagger-ui:latest
    # Outputs static HTML to serve
```

---

## 📞 Notes

- **Last Updated**: 2026-03-23
- **OpenAPI Version**: 3.0.0
- **API Version**: 1.0.0
- **Base URL**: `http://localhost:3000` (dev), `https://api.example.com` (prod)
- **Format**: REST over HTTP/JSON
- **Authentication**: Currently none (add OAuth2/JWT as needed)

---

## ✅ Validation Checklist

- [x] All endpoints documented
- [x] Request/response schemas defined
- [x] Example payloads included
- [x] Error responses standardized
- [x] Parameter validation rules specified
- [x] Enums properly defined
- [x] Postman collection generated
- [x] Validation script provided
- [x] README documentation complete

