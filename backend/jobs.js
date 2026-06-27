const jobs = new Map();
let nextJobId = 1;

function createJob(originalFilename, targetFormat) {
  const id = nextJobId++;
  const job = {
    id,
    original_filename: originalFilename,
    target_format: targetFormat,
    status: 'pending',
    result_filename: null,
    error_message: null,
    created_at: new Date().toISOString(),
  };
  jobs.set(id, job);
  return job;
}

function getJob(id) {
  return jobs.get(Number(id));
}

function updateJob(job) {
  if (!job || !job.id) return;
  jobs.set(job.id, job);
}

module.exports = {
  createJob,
  getJob,
  updateJob,
};
