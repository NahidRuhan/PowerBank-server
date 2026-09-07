const fs = require('fs');
const collection = JSON.parse(fs.readFileSync('powerbank_collection.json', 'utf8'));

const endpointsToAdd = [
  { folder: '1. Auth', name: 'Google OAuth Login', method: 'GET', url: 'auth/google', auth: false },
  { folder: '1. Auth', name: 'Google OAuth Callback', method: 'GET', url: 'auth/google/callback', auth: false },
  { folder: '4. Infrastructure (Substations)', name: 'Get Substation By ID', method: 'GET', url: 'substations/REPLACE_WITH_SUBSTATION_ID', auth: true },
  { folder: '5. Infrastructure (Feeders)', name: 'Get Feeder By ID', method: 'GET', url: 'feeders/REPLACE_WITH_FEEDER_ID', auth: true },
  { folder: '5. Infrastructure (Feeders)', name: 'Update Feeder Details', method: 'PATCH', url: 'feeders/REPLACE_WITH_FEEDER_ID', auth: true, body: { name: 'Updated Feeder Name' } },
  { folder: '6. Infrastructure (Areas)', name: 'Get Area By ID', method: 'GET', url: 'areas/REPLACE_WITH_AREA_ID', auth: true },
  { folder: '7. Quotas', name: 'Get Quota By ID', method: 'GET', url: 'quotas/REPLACE_WITH_QUOTA_ID', auth: true },
  { folder: '8. Schedules', name: 'Get Schedule By ID', method: 'GET', url: 'schedules/REPLACE_WITH_SCHEDULE_ID', auth: true },
  { folder: '8. Schedules', name: 'Delete Schedule', method: 'DELETE', url: 'schedules/REPLACE_WITH_SCHEDULE_ID', auth: true },
  { folder: '9. Incidents', name: 'Get Incident By ID', method: 'GET', url: 'incidents/REPLACE_WITH_INCIDENT_ID', auth: true },
  { folder: '10. Bills', name: 'Get Bill By ID', method: 'GET', url: 'bills/REPLACE_WITH_BILL_ID', auth: true }
];

const bearerAuth = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };

for (const ep of endpointsToAdd) {
  let folder = collection.item.find(i => i.name === ep.folder);
  if (!folder) {
    const words = ep.folder.split(' ');
    folder = collection.item.find(i => i.name.includes(words[1]));
  }
  
  if (folder) {
    const item = {
      name: ep.name,
      request: {
        method: ep.method,
        header: [],
        url: {
          raw: '{{baseUrl}}/' + ep.url,
          host: ['{{baseUrl}}'],
          path: ep.url.split('/')
        }
      }
    };
    if (ep.auth) item.request.auth = bearerAuth;
    if (ep.body) {
      item.request.header.push({ key: 'Content-Type', value: 'application/json' });
      item.request.body = { mode: 'raw', raw: JSON.stringify(ep.body, null, 2) };
    }
    folder.item.push(item);
  }
}

fs.writeFileSync('powerbank_collection.json', JSON.stringify(collection, null, 2));
console.log('Added missing endpoints!');
