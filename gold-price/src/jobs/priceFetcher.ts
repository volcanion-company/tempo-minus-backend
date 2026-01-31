import cron from 'node-cron';
import { fetchService } from '../services/fetchService';
import { logger } from '../utils/logger';

// Initial fetch on startup to populate cache immediately
export async function initializePriceFetcher() {
  try {
    logger.info('Running initial price fetch on startup');
    await fetchService.fetchPrices();
    logger.info('Initial price fetch completed successfully');
  } catch (error) {
    logger.error('Initial price fetch failed:', error);
  }
}

// Fetch prices every 1 minute during trading hours (8AM-5PM, Mon-Sat)
cron.schedule('* 8-17 * * 1-6', async () => {
  try {
    logger.info('Running price fetcher job (trading hours)');
    await fetchService.fetchPrices();
  } catch (error) {
    logger.error('Price fetcher job failed:', error);
  }
}, {
  timezone: 'Asia/Ho_Chi_Minh'
});

// Fetch prices every 5 minutes outside trading hours
cron.schedule('*/5 0-7,18-23 * * *', async () => {
  try {
    logger.info('Running price fetcher job (non-trading hours)');
    await fetchService.fetchPrices();
  } catch (error) {
    logger.error('Price fetcher job failed:', error);
  }
}, {
  timezone: 'Asia/Ho_Chi_Minh'
});

logger.info('Price fetcher job scheduled');
