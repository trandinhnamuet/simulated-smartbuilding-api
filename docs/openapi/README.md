# OpenAPI Documentation

Comprehensive OpenAPI 3.0.0 specification for the Smart Building & Industrial IoT API.

## Files

- **`openapi.yaml`** — Main OpenAPI specification (all endpoints, schemas, examples)

## Quick Start

### View in Swagger UI

#### Option 1: Online (via Swagger Editor)
1. Go to https://editor.swagger.io
2. Click **File** → **Import File** → select `openapi.yaml`

#### Option 2: Local Swagger UI (Docker)
```bash
docker run -p 8080:8080 \
  -v $(pwd)/openapi.yaml:/usr/share/nginx/html/openapi.yaml \
  -e SWAGGER_JSON=/usr/share/nginx/html/openapi.yaml \
  swaggerapi/swagger-ui

# Access at: http://localhost:8080
```

#### Option 3: Local Swagger UI (Node.js)
```bash
# Install swagger-ui-dist globally
npm install -g swagger-ui-dist

# Serve static files from swagger-ui-dist
npx http-server /path/to/swagger-ui-dist -p 8080

# Then open http://localhost:8080 and paste the openapi.yaml URL
```

### View in ReDoc (Alternative UI)

#### Online
Go to https://redocly.com/redoc and paste `openapi.yaml` content.

#### Local (Docker)
```bash
docker run -p 8081:80 \
  -e SPEC_URL=file:///opt/openapi.yaml \
  -v $(pwd)/openapi.yaml:/opt/openapi.yaml \
  redocly/redoc

# Access at: http://localhost:8081
```

## API Sections

### 1. **Machines** (`/api/v1/machines`)
- `POST /api/v1/machines` — Create machine
- `GET /api/v1/machines` — List machines (filterable, paginated)
- `GET /api/v1/machines/{id}` — Get machine by ID
- `PATCH /api/v1/machines/{id}/activate` — Activate
- `PATCH /api/v1/machines/{id}/deactivate` — Deactivate

### 2. **Sensor Readings** (`/api/v1/machines/:machineId/readings`)
- `GET /readings` — Historical readings (paginated)
- `GET /readings/latest` — Most recent persisted reading
- `GET /readings/live` — Live simulated reading (ephemeral)
- `POST /readings/generate` — Generate and persist N readings
- `GET /api/v1/sensor-readings/anomalies` — All anomalies across machines

### 3. **Maintenance Records** (`/api/v1/machines/:machineId/maintenance`)
- `POST` — Create maintenance record
- `GET` — List records for machine
- `GET /{recordId}` — Get specific record

### 4. **Rooms** (`/api/v1/rooms`)
- `POST /api/v1/rooms` — Create room
- `GET /api/v1/rooms` — List rooms (filterable, paginated)
- `GET /api/v1/rooms/{id}` — Get room by ID

### 5. **Environmental Readings** (`/api/v1/rooms/:roomId/env-readings`)
- `GET /env-readings` — Historical readings (paginated)
- `GET /env-readings/latest` — Most recent reading
- `GET /env-readings/live` — Live simulated reading
- `POST /env-readings/generate` — Generate and persist N readings
- `GET /api/v1/env-readings/snapshot` — Latest for all rooms (dashboard)
- `GET /api/v1/env-readings/occupied` — Occupied rooms (PIR detected)
- `GET /api/v1/env-readings/high-co2?threshold=1000` — High CO2 alert

## Example Requests

### Create Machine
```bash
curl -X POST http://localhost:3000/api/v1/machines \
  -H "Content-Type: application/json" \
  -d '{
    "machineCode": "CNC_MILL_001",
    "machineType": "CNC_MILL",
    "locationZone": "Zone A",
    "floorNumber": 4,
    "installDate": "2024-01-15"
  }'
```

### Get Machine Readings
```bash
curl http://localhost:3000/api/v1/machines/{machineId}/readings?limit=10
```

### Get Live Sensor Reading (not persisted)
```bash
curl http://localhost:3000/api/v1/machines/{machineId}/readings/live
```

### Generate 100 Readings
```bash
curl -X POST http://localhost:3000/api/v1/machines/{machineId}/readings/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 100, "intervalSec": 10}'
```

### Get Room Environment Snapshot
```bash
curl http://localhost:3000/api/v1/env-readings/snapshot
```

### Get High CO2 Rooms
```bash
curl http://localhost:3000/api/v1/env-readings/high-co2?threshold=1200
```

## Data Models

### Machine Sensor Reading
- `temperatureC` — Operating temperature (°C)
- `vibrationMs2` — Vibration (mm/s²)
- `soundDb` — Noise level (dB)
- `powerKw` — Power consumption (kW)
- `oilLevelPct` — Oil level (0–100%)
- `coolantLevelPct` — Coolant level (0–100%, nullable)
- `laserIntensityW` — Laser power (W, LASER_CUTTER only)
- `hydraulicPressureBar` — Pressure (bar, HYDRAULIC_PRESS/INJECTION_MOLD)
- `spindleSpeedRpm` — Spindle speed (RPM, CNC only)
- `toolWearMm` — Tool wear (mm)
- `runtimeHours` — Cumulative runtime (hours)
- `cycleCount` — Total cycles
- `isAnomaly` — Anomaly detected flag
- `failureWithin7Days` — Predictive failure flag

### Room Environmental Reading
- `co2Ppm` — CO2 concentration (400–5000 ppm typical)
- `humidityPct` — Humidity (0–100%)
- `temperatureC` — Room temperature (°C)
- `luminosityLux` — Light level (lux)
- `pirValue` — PIR occupancy sensor (0 = empty, >0 = occupied)
- `isOccupied` — Derived occupancy boolean

## Machine Types
- `CNC_MILL`, `FURNACE`, `ROBOT_ARM`, `LASER_CUTTER`
- `HYDRAULIC_PRESS`, `COMPRESSOR`, `CONVEYOR`, `PUMP`
- `TURBINE`, `WELDER`, `THREE_D_PRINTER`, `INJECTION_MOLD`

## Room Types
- `OFFICE`, `LAB`, `CONFERENCE`, `CORRIDOR`, `UTILITY`

## Maintenance Types
- `ROUTINE` — Schedule maintenance
- `CORRECTIVE` — Unplanned repair
- `PREDICTIVE` — Anticipated maintenance

## Validation & Testing

### Validate OpenAPI Spec
```bash
# Install Swagger validator
npm install -g swagger-cli

# Validate file
swagger-cli validate openapi.yaml
```

### Using Postman
1. Open Postman
2. Click **Import** → **Link** → paste OpenAPI URL or file path
3. API specification auto-imported as collection
4. Test endpoints directly in Postman

### Using VS Code
1. Install **OpenAPI (Swagger) Editor** extension
2. Right-click `openapi.yaml` → **View in Swagger Viewer**

## Notes

- All timestamps are ISO 8601 format (UTC)
- All IDs are UUIDs (RFC 4122)
- Pagination: `page` (1-indexed), `limit` (default 20)
- Filters are optional (AND logic if multiple provided)
- Live endpoints return ephemeral simulated data (not persisted)
- Occupancy: PIR ~6% non-zero readings match historical dataset patterns
