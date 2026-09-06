const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '..', 'powerbank_collection.json');
const data = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Check if Phase 5 folders already exist
const hasBills = data.item.find(i => i.name === '10. Bills');
if (hasBills) {
  console.log('Collection already has Bills folder.');
} else {
  const phase5Folders = [
    {
      name: '10. Bills',
      item: [
        {
          name: 'Generate Bills',
          request: {
            auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: '{\n  "month": "2026-09",\n  "baseAmount": 1500,\n  "dueDate": "2026-10-15T00:00:00Z"\n}',
            },
            url: { raw: '{{baseUrl}}/bills/generate', host: ['{{baseUrl}}'], path: ['bills', 'generate'] },
          },
        },
        {
          name: 'Get All Bills (Admin)',
          request: {
            auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
            method: 'GET',
            header: [],
            url: { raw: '{{baseUrl}}/bills', host: ['{{baseUrl}}'], path: ['bills'] },
          },
        },
        {
          name: 'Get My Bills (Customer)',
          request: {
            auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
            method: 'GET',
            header: [],
            url: { raw: '{{baseUrl}}/bills/my-bills', host: ['{{baseUrl}}'], path: ['bills', 'my-bills'] },
          },
        },
      ],
    },
    {
      name: '11. Payments',
      item: [
        {
          name: 'Initiate Payment',
          request: {
            auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: '{\n  "billId": "REPLACE_WITH_BILL_ID"\n}',
            },
            url: { raw: '{{baseUrl}}/payments/initiate', host: ['{{baseUrl}}'], path: ['payments', 'initiate'] },
          },
        },
        {
          name: 'Get My Payments',
          request: {
            auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
            method: 'GET',
            header: [],
            url: { raw: '{{baseUrl}}/payments/my-payments', host: ['{{baseUrl}}'], path: ['payments', 'my-payments'] },
          },
        },
        {
          name: 'Refund Payment (Admin)',
          request: {
            auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
            method: 'POST',
            header: [],
            url: { raw: '{{baseUrl}}/payments/REPLACE_WITH_PAYMENT_ID/refund', host: ['{{baseUrl}}'], path: ['payments', 'REPLACE_WITH_PAYMENT_ID', 'refund'] },
          },
        },
      ],
    }
  ];

  data.item.push(...phase5Folders);
  fs.writeFileSync(collectionPath, JSON.stringify(data, null, 2));
  console.log('Collection updated successfully for Phase 5');
}
