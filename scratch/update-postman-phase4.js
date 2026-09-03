const fs = require('fs');

const data = JSON.parse(fs.readFileSync('powerbank_collection.json', 'utf8'));

const phase4Folders = [
  {
    name: "9. Incidents",
    item: [
      {
        name: "Create Incident",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "POST",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: "{\n  \"feederId\": \"REPLACE_WITH_FEEDER_ID\",\n  \"description\": \"Transformer exploded due to overload\"\n}"
          },
          url: { raw: "{{baseUrl}}/incidents", host: ["{{baseUrl}}"], path: ["incidents"] }
        }
      },
      {
        name: "Get All Incidents",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "GET",
          header: [],
          url: { raw: "{{baseUrl}}/incidents", host: ["{{baseUrl}}"], path: ["incidents"] }
        }
      },
      {
        name: "Update Incident",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "PATCH",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: "{\n  \"status\": \"REPAIRING\",\n  \"estimatedRestoration\": \"2026-09-04T12:00:00.000Z\"\n}"
          },
          url: { raw: "{{baseUrl}}/incidents/REPLACE_WITH_INCIDENT_ID", host: ["{{baseUrl}}"], path: ["incidents", "REPLACE_WITH_INCIDENT_ID"] }
        }
      },
      {
        name: "Resolve Incident",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "PATCH",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: "{\n  \"status\": \"RESOLVED\"\n}"
          },
          url: { raw: "{{baseUrl}}/incidents/REPLACE_WITH_INCIDENT_ID", host: ["{{baseUrl}}"], path: ["incidents", "REPLACE_WITH_INCIDENT_ID"] }
        }
      }
    ]
  }
];

data.item.push(...phase4Folders);
fs.writeFileSync('powerbank_collection.json', JSON.stringify(data, null, 2));
console.log('Collection updated successfully for Phase 4');
