const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || path.join(__dirname, '../uploads');

exports.initScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const oldJobs = await prisma.job.findMany({
        where: {
          created_at: {
            lt: fiveMinutesAgo
          }
        }
      });

      for (const job of oldJobs) {
        try {
          const filepath = path.join(UPLOAD_FOLDER, job.original_filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`Deleted uploaded file (scheduled cleanup): ${job.original_filename}`);
          }
          
          if (job.result_filename) {
             const resultPath = path.join(UPLOAD_FOLDER, job.result_filename);
             if (fs.existsSync(resultPath)) {
               fs.unlinkSync(resultPath);
               console.log(`Deleted result file (scheduled cleanup): ${job.result_filename}`);
             }
          }
          
          // Optionally delete from DB if that was the intent, 
          // Python backend didn't seem to delete the db record, just the file.
        } catch (err) {
          console.error(`Error deleting file for job ${job.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Error during scheduled cleanup:', err.message);
    }
  });

  console.log("File cleanup scheduler started");
};
