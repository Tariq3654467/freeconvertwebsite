const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createJob(originalFilename, targetFormat, userId = null) {
  const job = await prisma.job.create({
    data: {
      original_filename: originalFilename,
      target_format: targetFormat,
      status: 'pending',
      user_id: userId,
    }
  });
  return job;
}

async function getJob(id) {
  const jobId = Number(id);
  if (isNaN(jobId)) return null;
  
  return await prisma.job.findUnique({
    where: { id: jobId }
  });
}

async function updateJob(jobParam) {
  if (!jobParam || !jobParam.id) return;

  const updateData = {};
  if (jobParam.status) updateData.status = jobParam.status;
  if (jobParam.result_filename !== undefined) updateData.result_filename = jobParam.result_filename;
  if (jobParam.error_message !== undefined) updateData.error_message = jobParam.error_message;

  await prisma.job.update({
    where: { id: jobParam.id },
    data: updateData
  });
}

module.exports = {
  createJob,
  getJob,
  updateJob,
};
