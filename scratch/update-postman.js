const fs = require('fs');

const data = JSON.parse(fs.readFileSync('powerbank_collection.json', 'utf8'));

const phase3Folders = [
  {
    name: "7. Quotas",
    item: [
      {
        name: "Create Quota",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "POST",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: "{\n  \"date\": \"2026-09-04T00:00:00.000Z\",\n  \"timeSlot\": \"18:00-19:00\",\n  \"targetMW\": 150\n}"
          },
          url: { raw: "{{baseUrl}}/quotas", host: ["{{baseUrl}}"], path: ["quotas"] }
        }
      },
      {
        name: "Get All Quotas",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "GET",
          header: [],
          url: { raw: "{{baseUrl}}/quotas", host: ["{{baseUrl}}"], path: ["quotas"] }
        }
      }
    ]
  },
  {
    name: "8. Schedules",
    item: [
      {
        name: "Create Schedule",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "POST",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: "{\n  \"feederId\": \"REPLACE_WITH_FEEDER_ID\",\n  \"quotaId\": \"REPLACE_WITH_QUOTA_ID\",\n  \"startTime\": \"2026-09-04T18:00:00.000Z\",\n  \"endTime\": \"2026-09-04T19:00:00.000Z\",\n  \"reason\": \"Evening Peak Shedding\"\n}"
          },
          url: { raw: "{{baseUrl}}/schedules", host: ["{{baseUrl}}"], path: ["schedules"] }
        }
      },
      {
        name: "Get All Schedules",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "GET",
          header: [],
          url: { raw: "{{baseUrl}}/schedules", host: ["{{baseUrl}}"], path: ["schedules"] }
        }
      },
      {
        name: "Update Schedule Status",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "PATCH",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: "{\n  \"status\": \"ACTIVE\"\n}"
          },
          url: { raw: "{{baseUrl}}/schedules/REPLACE_WITH_SCHEDULE_ID/status", host: ["{{baseUrl}}"], path: ["schedules", "REPLACE_WITH_SCHEDULE_ID", "status"] }
        }
      },
      {
        name: "Get Fairness Stats",
        request: {
          auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
          method: "GET",
          header: [],
          url: { raw: "{{baseUrl}}/schedules/fairness", host: ["{{baseUrl}}"], path: ["schedules", "fairness"] }
        }
      }
    ]
  }
];

data.item.push(...phase3Folders);
fs.writeFileSync('powerbank_collection.json', JSON.stringify(data, null, 2));
console.log('Collection updated successfully');
