require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { createJob, getJob, updateJob } = require('./jobs');
const { ALLOWED_EXTENSIONS, assertConversionSupported, convertFile } = require('./conversion');

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5000;

fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('File type not allowed'), false);
    }
    cb(null, true);
  },
});

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

app.post('/api/convert/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const targetFormat = String(req.body.target_format || '').toLowerCase();
  const originalExt = path.extname(req.file.originalname).slice(1).toLowerCase();

  if (!targetFormat || !ALLOWED_EXTENSIONS.has(targetFormat)) {
    return res.status(400).json({ message: 'Invalid target format' });
  }

  try {
    assertConversionSupported(originalExt, targetFormat);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const job = createJob(req.file.filename, targetFormat);
  return res.status(201).json({ message: 'File uploaded', job_id: job.id });
});

app.post('/api/convert/process/:jobId', async (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.status !== 'pending') {
    return res.status(400).json({ message: 'Job already processed' });
  }

  job.status = 'processing';
  updateJob(job);

  const inputPath = path.join(UPLOAD_FOLDER, job.original_filename);
  const originalExt = path.extname(job.original_filename).slice(1).toLowerCase();
  const outputFilename = `${path.basename(job.original_filename, path.extname(job.original_filename))}.${job.target_format}`;
  const outputPath = path.join(UPLOAD_FOLDER, outputFilename);
  const options = req.body || {};

  try {
    await convertFile(inputPath, outputPath, originalExt, job.target_format, options);
    job.status = 'done';
    job.result_filename = outputFilename;
    updateJob(job);
    return res.status(200).json({ message: 'Job complete', job_id: job.id, status: 'done' });
  } catch (err) {
    job.status = 'failed';
    job.error_message = err.message;
    updateJob(job);
    return res.status(500).json({ message: `Conversion failed: ${err.message}` });
  }
});

app.post('/api/convert/compress/:jobId', async (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.status !== 'pending') {
    return res.status(400).json({ message: 'Job already processed' });
  }

  job.status = 'processing';
  updateJob(job);

  const inputPath = path.join(UPLOAD_FOLDER, job.original_filename);
  const originalExt = path.extname(job.original_filename).slice(1).toLowerCase();
  const outputFilename = `${path.basename(job.original_filename, path.extname(job.original_filename))}.${originalExt}`;
  const outputPath = path.join(UPLOAD_FOLDER, outputFilename);
  const options = {
    quality: Number(req.body.quality || req.body.quality || 75),
    resizePercent: Number(req.body.resize_percent || req.body.resizePercent || 100),
  };

  try {
    await convertFile(inputPath, outputPath, originalExt, 'compress', options);
    job.status = 'done';
    job.result_filename = outputFilename;
    updateJob(job);
    return res.status(200).json({ message: 'Compression complete', job_id: job.id, status: 'done' });
  } catch (err) {
    job.status = 'failed';
    job.error_message = err.message;
    updateJob(job);
    return res.status(500).json({ message: `Compression failed: ${err.message}` });
  }
});

app.get('/api/convert/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  return res.json({ status: job.status, error_message: job.error_message ?? null });
});

app.get('/api/convert/download/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.status !== 'done' || !job.result_filename) {
    return res.status(400).json({ message: 'Job not ready for download' });
  }
  const filePath = path.join(UPLOAD_FOLDER, job.result_filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Result file not found' });
  }
  return res.download(filePath, job.result_filename);
});

app.listen(PORT, () => {
  console.log(`Express conversion backend running on port ${PORT}`);
});
