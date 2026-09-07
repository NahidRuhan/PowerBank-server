import cron from 'node-cron';
import { BillService } from '../modules/bill/bill.service.js';

export function initCronJobs() {
  // Run daily at midnight to process overdue bills
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running processOverdueBills...');
    try {
      const result = await BillService.processOverdueBills();
      console.log("[CRON] Processed ${result.processedCount} overdue bills.");
    } catch (error) {
      console.error('[CRON] Failed to process overdue bills:', error);
    }
  });

  console.log('[CRON] Jobs initialized.');
}
