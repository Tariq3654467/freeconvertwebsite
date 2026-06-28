require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { createJob, getJob, updateJob } = require('./jobs');
const { ALLOWED_EXTENSIONS, assertConversionSupported, convertFile } = require('./conversion');
const { PDFDocument, rgb } = require('pdf-lib');
const { initScheduler } = require('./utils/cleanup');

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const pageRoutes = require('./routes/pages');
const { jwtOptional } = require('./middleware/auth');

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5000;

fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });

// Background file cleanup
initScheduler();

const app = express();

app.use('/uploads', express.static(UPLOAD_FOLDER));

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
  limits: { fileSize: 1 * 1024 * 1024 * 1024 }, // 1GB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('File type not allowed'), false);
    }
    cb(null, true);
  },
});

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/blogs', blogRoutes); // Using this prefix based on previous layout
app.use('/api/pages', pageRoutes);

// Convert routes
app.post('/api/convert/upload', jwtOptional, upload.single('file'), async (req, res) => {
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

  const userId = req.user ? req.user.user_id : null;
  const job = await createJob(req.file.filename, targetFormat, userId);
  return res.status(201).json({ message: 'File uploaded', job_id: job.id });
});

app.post('/api/convert/process/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.status !== 'pending') {
    return res.status(400).json({ message: 'Job already processed' });
  }

  job.status = 'processing';
  await updateJob(job);

  const inputPath = path.join(UPLOAD_FOLDER, job.original_filename);
  const originalExt = path.extname(job.original_filename).slice(1).toLowerCase();
  const outputFilename = `${path.basename(job.original_filename, path.extname(job.original_filename))}.${job.target_format}`;
  const outputPath = path.join(UPLOAD_FOLDER, outputFilename);
  const options = req.body || {};

  try {
    await convertFile(inputPath, outputPath, originalExt, job.target_format, options);
    job.status = 'done';
    job.result_filename = outputFilename;
    await updateJob(job);
    return res.status(200).json({ message: 'Job complete', job_id: job.id, status: 'done' });
  } catch (err) {
    job.status = 'failed';
    job.error_message = err.message;
    await updateJob(job);
    return res.status(500).json({ message: `Conversion failed: ${err.message}` });
  }
});

app.post('/api/convert/compress/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.status !== 'pending') {
    return res.status(400).json({ message: 'Job already processed' });
  }

  job.status = 'processing';
  await updateJob(job);

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
    await updateJob(job);
    return res.status(200).json({ message: 'Compression complete', job_id: job.id, status: 'done' });
  } catch (err) {
    job.status = 'failed';
    job.error_message = err.message;
    await updateJob(job);
    return res.status(500).json({ message: `Compression failed: ${err.message}` });
  }
});

app.get('/api/convert/status/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  return res.json({ status: job.status, error_message: job.error_message ?? null });
});

app.get('/api/convert/download/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
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

// PDF Editing route
app.post('/api/convert/edit-pdf', jwtOptional, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  let actions = [];
  try {
    actions = JSON.parse(req.body.actions || '[]');
  } catch (e) {
    return res.status(400).json({ message: 'Invalid actions payload' });
  }

  const inputPath = path.join(UPLOAD_FOLDER, req.file.filename);
  const outputFilename = `edited_${req.file.filename}`;
  const outputPath = path.join(UPLOAD_FOLDER, outputFilename);

  try {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    let pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Handle delete-page actions first
    const deletePages = [];
    for (const action of actions) {
      if (action.type === 'delete-page' && action.pages) {
        deletePages.push(...action.pages);
      }
    }
    // Remove duplicates and sort descending
    const uniqueDeletePages = [...new Set(deletePages)].sort((a, b) => b - a);
    for (const pageNum of uniqueDeletePages) {
      if (pageNum >= 1 && pageNum <= pages.length) {
        pdfDoc.removePage(pageNum - 1);
      }
    }
    // Refresh pages after deletion
    pages = pdfDoc.getPages();

    // Handle rotation actions
    const rotations = {};
    for (const action of actions) {
      if (action.type === 'rotate' && action.pages && action.angle !== undefined) {
        for (const pageNum of action.pages) {
          if (pageNum >= 1 && pageNum <= pages.length) {
            const targetPage = pages[pageNum - 1];
            if (targetPage) {
              const currentRotation = targetPage.getRotation().angle;
              const newRotation = currentRotation + (action.angle || 90);
              targetPage.setRotation({ type: 'degrees', angle: newRotation });
            }
          }
        }
      }
    }

    // Handle watermark actions
    for (const action of actions) {
      if (action.type === 'watermark') {
        const text = action.text || "WATERMARK";
        const size = action.size || 30;
        const opacity = action.opacity !== undefined ? action.opacity : 0.5;
        const colorHex = action.color || "#ef4444";
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;
        pages.forEach(page => {
           const { width, height } = page.getSize();
           page.drawText(text, {
             x: width / 4,
             y: height / 2,
             size: size,
             color: rgb(r, g, b),
             opacity: opacity,
             rotate: { type: 'degrees', angle: 45 }
           });
        });
      }
    }

    // Handle compress actions
    const hasCompress = actions.some(a => a.type === 'compress');
    let modifiedBytes = await pdfDoc.save({ useObjectStreams: true });
    fs.writeFileSync(outputPath, modifiedBytes);

    if (hasCompress) {
      // Re-save to strip dead objects and reduce size
      const pdfDoc2 = await PDFDocument.load(fs.readFileSync(outputPath));
      const compressedBytes = await pdfDoc2.save({ useObjectStreams: true });
      fs.writeFileSync(outputPath, compressedBytes);
    }

    return res.download(outputPath, outputFilename);
  } catch (err) {
    return res.status(500).json({ message: `Editing failed: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Express conversion backend running on port ${PORT}`);
});
