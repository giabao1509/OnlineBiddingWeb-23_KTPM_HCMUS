// cron.js
import cron from 'node-cron';
import db from './db.js';

export function startAuctionUpdater() {
  cron.schedule('* * * * *', async () => {
    try {
      await db.raw(`
        UPDATE auction
        SET status = 'Completed'
        WHERE end_time <= (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND status = 'Bidding';
      `);
      console.log('Updated auction status successfully', new Date());
    } catch (err) {
      console.error('Error updating auction status:', err);
    }
  });

  console.log('Auction updater cron job started');
}
