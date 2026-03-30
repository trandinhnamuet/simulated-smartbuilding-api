# API Endpoints Reference

Quick reference of all available endpoints organized by module.

## 🏭 Machines Module

### Create Machine
```
POST /api/v1/machines
Content-Type: application/json

Request:
{
  "machineCode": "CNC_MILL_001",
  "machineType": "CNC_MILL",
  "locationZone": "Zone A",
  "floorNumber": 4,
  "installDate": "2024-01-15"
}

Response: 201
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "machineCode": "CNC_MILL_001",
  "machineType": "CNC_MILL",
  "isActive": true,
  ...
}
```

### List Machines (Paginated)
```
GET /api/v1/machines?machineType=CNC_MILL&locationZone=Zone%20A&page=1&limit=20

Query Parameters:
- machineType (optional)   — Filter by machine type
- locationZone (optional)  — Filter by location
- floorNumber (optional)   — Filter by floor
- page (default: 1)        — Page number
- limit (default: 20)      — Items per page

Response: 200
{
  "data": [...],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

### Get Machine by ID
```
GET /api/v1/machines/{id}

Path Parameters:
- id (required)  — Machine UUID

Response: 200
{...}

Response: 404
{"statusCode": 404, "message": "Machine not found"}
```

### Activate Machine
```
PATCH /api/v1/machines/{id}/activate

Response: 200
{"isActive": true, ...}
```

### Deactivate Machine
```
PATCH /api/v1/machines/{id}/deactivate

Response: 200
{"isActive": false, ...}
```

---

## 📊 Sensor Readings Module

### Get Sensor Readings (Paginated)
```
GET /api/v1/machines/{machineId}/readings
    ?page=1&limit=20&startTime=2026-03-23T00:00:00Z&endTime=2026-03-23T23:59:59Z

Response: 200
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "machineId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-03-23T12:30:45Z",
      "temperatureC": 45.2,
      "vibrationMs2": 3.5,
      "soundDb": 78.9,
      "powerKw": 12.5,
      "oilLevelPct": 85.0,
      "coolantLevelPct": 90.0,
      "isAnomaly": false
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### Get Latest Sensor Reading (Most Recent Persisted)
```
GET /api/v1/machines/{machineId}/readings/latest

Response: 200
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2026-03-23T12:30:45Z",
  "temperatureC": 45.2,
  ...
}
```

### Get Live Sensor Reading (Simulated, Not Persisted)
```
GET /api/v1/machines/{machineId}/readings/live

Response: 200
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2026-03-23T12:31:15Z",
  "temperatureC": 45.8,
  ...
}
Note: Each call returns a new ephemeral simulated reading
```

### Generate and Save Sensor Readings
```
POST /api/v1/machines/{machineId}/readings/generate
Content-Type: application/json

Request:
{
  "count": 100,
  "intervalSec": 10
}

Response: 201
{
  "count": 100,
  "interval": 10
}
```

### Get Anomalies (All Machines)
```
GET /api/v1/sensor-readings/anomalies?page=1&limit=20

Response: 200
{
  "data": [
    {"id": "...", "isAnomaly": true, ...}
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

## 🔧 Maintenance Records Module

### Create Maintenance Record
```
POST /api/v1/machines/{machineId}/maintenance
Content-Type: application/json

Request:
{
  "maintenanceType": "ROUTINE",
  "notes": "Regular maintenance check",
  "performedAt": "2026-03-23T10:30:00Z"
}

Response: 201
{
  "id": 1,
  "machineId": "550e8400-e29b-41d4-a716-446655440000",
  "maintenanceType": "ROUTINE",
  "performedAt": "2026-03-23T10:30:00Z",
  ...
}
```

### List Maintenance Records for Machine
```
GET /api/v1/machines/{machineId}/maintenance?page=1&limit=20

Response: 200
{
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

### Get Maintenance Record by ID
```
GET /api/v1/machines/{machineId}/maintenance/{recordId}

Response: 200
{...}
```

---

## 🏢 Rooms Module

### Create Room
```
POST /api/v1/rooms
Content-Type: application/json

Request:
{
  "roomCode": "413",
  "floorNumber": 4,
  "locationZone": "Wing A",
  "areaM2": 28,
  "roomType": "OFFICE"
}

Response: 201
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "roomCode": "413",
  "floorNumber": 4,
  ...
}
```

### List Rooms (Paginated, Filterable)
```
GET /api/v1/rooms?floorNumber=4&roomType=OFFICE&page=1&limit=20

Response: 200
{
  "data": [...],
  "total": 51,
  "page": 1,
  "limit": 20
}
```

### Get Room by ID
```
GET /api/v1/rooms/{id}

Response: 200
{...}
```

---

## 🌡️ Environmental Sensor Readings Module

### Get Environmental Readings for Room (Paginated)
```
GET /api/v1/rooms/{roomId}/env-readings
    ?page=1&limit=20&startTime=2026-03-23T00:00:00Z

Response: 200
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "roomId": "770e8400-e29b-41d4-a716-446655440002",
      "timestamp": "2026-03-23T14:30:15Z",
      "co2Ppm": 876.29,
      "humidityPct": 43.99,
      "temperatureC": 24.16,
      "luminosityLux": 364.6,
      "pirValue": 0,
      "isOccupied": false
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

### Get Latest Environmental Reading
```
GET /api/v1/rooms/{roomId}/env-readings/latest

Response: 200
{
  "timestamp": "2026-03-23T14:30:15Z",
  "co2Ppm": 876.29,
  ...
}
```

### Get Live Environmental Reading (Ephemeral)
```
GET /api/v1/rooms/{roomId}/env-readings/live

Response: 200
{
  "timestamp": "2026-03-23T14:31:00Z",
  "co2Ppm": 892.15,
  ...
}
Note: Each call returns new simulated data
```

### Generate and Save Environmental Readings
```
POST /api/v1/rooms/{roomId}/env-readings/generate
Content-Type: application/json

Request:
{
  "count": 100,
  "intervalSec": 5
}

Response: 201
{
  "count": 100,
  "interval": 5
}
```

### Get Environmental Snapshot (All Rooms)
```
GET /api/v1/env-readings/snapshot

Response: 200
{
  "data": [
    {"roomId": "...", "co2Ppm": 876, "temperatureC": 24.2, ...},
    {"roomId": "...", "co2Ppm": 1200, "temperatureC": 25.1, ...},
    ...
  ]
}
Best for: Dashboard heatmaps, quick room status
```

### Get Occupied Rooms (PIR Detected)
```
GET /api/v1/env-readings/occupied?page=1&limit=20

Response: 200
{
  "data": [
    {"roomId": "...", "pirValue": 15.2, "isOccupied": true, ...},
    ...
  ],
  "total": 8,
  "page": 1,
  "limit": 20
}
Note: PIR value > 0 indicates occupancy
```

### Get High CO2 Rooms (Alert Endpoint)
```
GET /api/v1/env-readings/high-co2?threshold=1000

Query Parameters:
- threshold (default: 1000)  — CO2 threshold in ppm

Response: 200
{
  "data": [
    {"roomId": "...", "co2Ppm": 1200, ...},
    {"roomId": "...", "co2Ppm": 1450, ...}
  ]
}
Best for: Environmental alerts, air quality monitoring
```

---

## 📈 Common Patterns

### Error Responses
```
400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}

404 Not Found
{
  "statusCode": 404,
  "message": "Machine not found",
  "error": "Not Found"
}

500 Internal Server Error
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### Pagination
- All list endpoints support `page` (1-indexed) and `limit` parameters
- Response includes `total`, `page`, `limit` for pagination info

### Timestamps
- All timestamps in ISO 8601 format (UTC)
- Example: `2026-03-23T14:30:15Z`

### Filtering
- Use query parameters for filtering (AND logic if multiple)
- Examples:
  - `?machineType=CNC_MILL&locationZone=Zone%20A`
  - `?roomType=OFFICE&floorNumber=4`

---

## 🔗 Related Resources

- Full OpenAPI Spec: `openapi.yaml`
- Postman Collection: `Smart-Building-API.postman_collection.json`
- Documentation: `README.md` and `INDEX.md`
- Validator Script: `validate-openapi.js`

