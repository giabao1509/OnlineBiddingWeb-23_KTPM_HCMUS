// cron.js
import cron from 'node-cron';
import db from './db.js';
import * as emailService from './mail.js';


export function startOtpCleaner() {
    cron.schedule('* * * * *', async () => {
        try {
            // Xóa OTP hết hạn và trả về số dòng xóa
            const result = await db.raw(`
                DELETE FROM otp
                WHERE expired_at < NOW()
                RETURNING id;  
            `);

            if (result.rows.length > 0) {
                console.log(`Deleted ${result.rows.length} expired OTPs at ${new Date().toLocaleString()}`);
            } else {
                console.log('No expired OTPs to delete this minute');
            }
        } catch (err) {
            console.error('Error deleting expired OTPs:', err);
        }
    });

    console.log('OTP cleaner cron job started');
}

export function startAuctionUpdater() {
    cron.schedule('* * * * *', async () => {
        try {
            // UPDATE + lấy auction vừa kết thúc
            const result = await db.raw(`
                UPDATE auction
                SET status = 'Completed'
                WHERE end_time <= (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
                  AND status = 'Bidding'
                RETURNING auction_id, name, seller_id, winner_bidder_id;
            `);

            for (const auction of result.rows) {
                const { auction_id, name, seller_id, winner_bidder_id } = auction;

                const seller = await db('user_account')
                    .where('id', seller_id)
                    .select('email', 'full_name')
                    .first();

                const winner = winner_bidder_id
                    ? await db('user_account')
                    .where('id', winner_bidder_id)
                    .select('email', 'full_name')
                    .first()
                    : null;

                // Gửi email thông báo cho người bán
                await emailService.sendMailForSeller(seller.email, name, seller.full_name, auction_id);

                // Gửi email thông báo cho người thắng cuộc (nếu có)
                if (winner) {
                    await emailService.sendMailForWinnerBidder(winner.email, name, winner.full_name, auction_id);
                }
            }

            if (result.rows.length > 0) {
                console.log(`Notified ${result.rows.length} ended auctions`);
            } else
            {
                console.log('No auctions ended this minute');
            }
        } catch (err) {
            console.error('Error updating auction status:', err);
        }
    });

    console.log('Auction updater cron job started');
}


export function startUpgradeRequestCleaner() {
  cron.schedule('0 0 * * *', async () => {
    try {
        const result = await db('upgrade_request')
            .whereRaw("created_at < NOW() - INTERVAL '7 days'")
            .andWhere('status', 'Pending')
            .update({ status: 'Expired' });
        console.log(`Cleaned up ${result} expired upgrade requests`);
    } catch (err) {
        console.error('Error cleaning upgrade requests:', err);
    }   
    });
    console.log('Upgrade request cleaner cron job started');
}