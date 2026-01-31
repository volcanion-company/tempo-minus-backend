import './priceFetcher';
import { initializePriceFetcher } from './priceFetcher';
// Import other jobs here as they are created
// import './alertChecker';
// import './dataAggregator';

export async function initializeJobs() {
  // Jobs are initialized when imported
  console.log('Background jobs initialized');
  
  // Run initial fetch to populate cache on startup
  await initializePriceFetcher();
}
