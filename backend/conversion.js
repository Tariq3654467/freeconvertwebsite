const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const libre = require('libreoffice-convert');
const Potrace = require('potrace');
const { Document, Packer, Paragraph, ImageRun } = require('docx');
const { Resvg } = require('@resvg/resvg-js');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');

let sharp = null;
try {
  sharp = require('sharp');
} catch (err) {
  sharp = null;
}

ffmpeg.setFfmpegPath(ffmpegStatic || 'ffmpeg');

const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'svg', 'heic', 'jfif',
  'pdf', 'docx', 'mp4', 'mp3', 'mov', 'avi', 'ogg', 'wav', 'm4a', 'flac', 'mkv', 'wmv', 'webm',
]);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'heic', 'jfif']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'ogg', 'wav', 'flac', 'm4a']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'wmv', 'webm', 'gif', 'apng']);

function normalizeExt(ext) {
  return ext.toLowerCase().replace(/^\./, '');
}

function assertConversionSupported(originalExt, targetExt) {
  if (targetExt === 'compress') return;

  if (IMAGE_EXTENSIONS.has(targetExt) && originalExt === 'pdf') {
    if (targetExt === 'svg') {
      throw new Error('PDF to SVG is not supported.');
    }
    return;
  }

  if (originalExt === 'svg' && IMAGE_EXTENSIONS.has(targetExt)) return;
  if (originalExt === 'svg' && targetExt === 'pdf') return;
  if (targetExt === 'svg' && IMAGE_EXTENSIONS.has(originalExt)) return;
  if (IMAGE_EXTENSIONS.has(targetExt) && IMAGE_EXTENSIONS.has(originalExt)) return;

  if (AUDIO_EXTENSIONS.has(targetExt)) {
    if (!AUDIO_EXTENSIONS.has(originalExt) && !VIDEO_EXTENSIONS.has(originalExt)) {
      throw new Error(`Cannot produce audio from .${originalExt}; upload an audio or video file.`);
    }
    return;
  }

  if (VIDEO_EXTENSIONS.has(targetExt)) {
    if (!VIDEO_EXTENSIONS.has(originalExt)) {
      throw new Error(`Cannot produce video from .${originalExt}; upload a video file.`);
    }
    return;
  }

  if (targetExt === 'pdf') {
    if (originalExt !== 'docx' && originalExt !== 'svg' && !IMAGE_EXTENSIONS.has(originalExt)) {
      throw new Error(`Cannot convert .${originalExt} to PDF.`);
    }
    return;
  }

  if (targetExt === 'docx') {
    if (originalExt !== 'pdf' && !IMAGE_EXTENSIONS.has(originalExt)) {
      throw new Error(`Cannot convert .${originalExt} to Word (.docx).`);
    }
    return;
  }

  throw new Error(`Conversion from .${originalExt} to .${targetExt} is not supported.`);
}

function getJimpMime(ext) {
  const normalized = normalizeExt(ext);
  if (['jpg', 'jpeg', 'jfif'].includes(normalized)) return Jimp.MIME_JPEG;
  if (normalized === 'png') return Jimp.MIME_PNG;
  if (normalized === 'bmp') return Jimp.MIME_BMP;
  if (['tiff', 'tif'].includes(normalized)) return Jimp.MIME_TIFF;
  if (normalized === 'gif') return Jimp.MIME_GIF;
  if (normalized === 'webp') return Jimp.MIME_WEBP;
  return null;
}

async function writeImage(image, outputPath, quality = 80) {
  const ext = normalizeExt(path.extname(outputPath));
  const mime = getJimpMime(ext);
  if (!mime) {
    throw new Error(`Unsupported image output format: .${ext}`);
  }

  if (mime === Jimp.MIME_JPEG) {
    image.quality(quality);
  }
  if (mime === Jimp.MIME_PNG) {
    image.deflateLevel(Math.round((100 - quality) / 10));
  }
  if (mime === Jimp.MIME_WEBP) {
    image.quality(quality);
  }

  await image.writeAsync(outputPath);
}

async function convertImageToImage(inputPath, outputPath) {
  const image = await Jimp.read(inputPath);
  await writeImage(image, outputPath);
}

async function pdfToImage(inputPath, outputPath) {
  if (sharp) {
    const ext = normalizeExt(path.extname(outputPath));
    await sharp(inputPath, { density: 300 }).toFormat(ext).toFile(outputPath);
    return;
  }

  const file = fs.readFileSync(inputPath);
  const pngBuffer = await convertWithLibre(file, '.png');
  const image = await Jimp.read(pngBuffer);
  await writeImage(image, outputPath);
}

async function svgToImage(inputPath, outputPath) {
  const svg = await fs.promises.readFile(inputPath, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngBuffer = resvg.render().asPng();
  if (normalizeExt(path.extname(outputPath)) === 'png') {
    await fs.promises.writeFile(outputPath, pngBuffer);
    return;
  }
  const image = await Jimp.read(pngBuffer);
  await writeImage(image, outputPath);
}

async function svgToPdf(inputPath, outputPath) {
  const svg = await fs.promises.readFile(inputPath, 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngBuffer = resvg.render().asPng();
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pngImage.width,
    height: pngImage.height,
  });
  const pdfBytes = await pdfDoc.save();
  await fs.promises.writeFile(outputPath, pdfBytes);
}

async function imageToSvg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    Potrace.trace(inputPath, { color: 'black' }, (err, svg) => {
      if (err) return reject(err);
      fs.writeFileSync(outputPath, svg);
      resolve();
    });
  });
}

async function imageToPdf(inputPath, outputPath) {
  if (sharp) {
    await sharp(inputPath).pdf().toFile(outputPath);
    return;
  }

  const image = await Jimp.read(inputPath);
  const pdfDoc = await PDFDocument.create();
  const imageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
  const pngImage = await pdfDoc.embedPng(imageBuffer);
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pngImage.width,
    height: pngImage.height,
  });
  const pdfBytes = await pdfDoc.save();
  await fs.promises.writeFile(outputPath, pdfBytes);
}

async function imageToDocx(inputPath, outputPath) {
  const imageBuffer = fs.readFileSync(inputPath);
  const image = await Jimp.read(inputPath);
  const width = image.bitmap.width || 600;
  const height = image.bitmap.height || 400;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: Math.min(1200, width),
                  height: Math.min(1200, height),
                },
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.promises.writeFile(outputPath, buffer);
}

function convertWithLibre(inputBuffer, toExt) {
  return new Promise((resolve, reject) => {
    libre.convert(inputBuffer, toExt, undefined, (err, done) => {
      if (err) return reject(err);
      resolve(done);
    });
  });
}

async function pdfToDocx(inputPath, outputPath) {
  const file = fs.readFileSync(inputPath);
  const converted = await convertWithLibre(file, '.docx');
  await fs.promises.writeFile(outputPath, converted);
}

async function docxToPdf(inputPath, outputPath) {
  const file = fs.readFileSync(inputPath);
  const converted = await convertWithLibre(file, '.pdf');
  await fs.promises.writeFile(outputPath, converted);
}

function ffmpegConvert(inputPath, outputPath, args = []) {
  return new Promise((resolve, reject) => {
    const proc = ffmpeg(inputPath)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err));

    args.forEach((arg) => proc.addOutputOption(arg));
    proc.run();
  });
}

async function convertAudio(inputPath, outputPath, originalExt, targetExt) {
  const args = ['-y', '-vn'];
  if (targetExt === 'mp3') args.push('-codec:a', 'libmp3lame', '-q:a', '2');
  if (targetExt === 'ogg') args.push('-codec:a', 'libvorbis', '-q:a', '4');
  if (targetExt === 'wav') args.push('-codec:a', 'pcm_s16le');
  if (targetExt === 'flac') args.push('-codec:a', 'flac');
  if (targetExt === 'm4a') args.push('-codec:a', 'aac', '-b:a', '192k');
  await ffmpegConvert(inputPath, outputPath, args);
}

async function convertVideo(inputPath, outputPath, originalExt, targetExt) {
  const args = ['-y'];
  if (AUDIO_EXTENSIONS.has(targetExt)) {
    args.push('-vn');
    return convertAudio(inputPath, outputPath, originalExt, targetExt);
  }

  if (targetExt === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '128k');
  } else if (targetExt === 'mov') {
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '128k');
  } else if (targetExt === 'mkv') {
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-c:a', 'aac', '-b:a', '128k');
  } else if (targetExt === 'webm') {
    args.push('-c:v', 'libvpx-vp9', '-b:v', '2M', '-c:a', 'libopus');
  } else if (targetExt === 'avi') {
    args.push('-c:v', 'mpeg4', '-qscale:v', '5', '-c:a', 'mp3');
  } else if (targetExt === 'wmv') {
    args.push('-c:v', 'wmv2', '-c:a', 'wmav2');
  } else {
    args.push('-c:v', 'copy', '-c:a', 'copy');
  }

  await ffmpegConvert(inputPath, outputPath, args);
}

async function compressImage(inputPath, outputPath, quality = 75, resizePercent = 100) {
  const image = await Jimp.read(inputPath);
  const width = Math.round(image.bitmap.width * (resizePercent / 100));
  const height = Math.round(image.bitmap.height * (resizePercent / 100));
  if (width > 0 && height > 0) {
    image.resize(width, height);
  }
  await writeImage(image, outputPath, quality);
}

async function compressAudioOrVideo(inputPath, outputPath, quality = 75) {
  const args = ['-y'];
  const ext = normalizeExt(path.extname(outputPath));
  if (AUDIO_EXTENSIONS.has(ext)) {
    args.push('-codec:a', 'libmp3lame', '-q:a', String(Math.max(2, Math.min(8, Math.round(10 - quality / 12.5)))));
  } else {
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', String(Math.max(18, Math.min(30, Math.round(40 - quality / 4)))));
    args.push('-c:a', 'aac', '-b:a', '128k');
  }
  await ffmpegConvert(inputPath, outputPath, args);
}

function compressPdf(inputPath, outputPath, qualityPreset) {
  return new Promise((resolve, reject) => {
    // Attempt standard PDF size reduction using pdf-lib (strips dead objects natively) or system GS if equipped.
    PDFDocument.load(fs.readFileSync(inputPath)).then(pdfDoc => {
        pdfDoc.save({ useObjectStreams: true }).then(bytes => {
           fs.writeFileSync(outputPath, bytes);
           resolve();
        }).catch(reject);
    }).catch(reject);
  });
}

async function convertFile(inputPath, outputPath, originalExt, targetExt, options = {}) {
  const extNormalized = normalizeExt(targetExt);
  const originalNormalized = normalizeExt(originalExt);

  assertConversionSupported(originalNormalized, extNormalized);

  if (extNormalized === 'compress') {
    if (originalNormalized === 'pdf') {
      return compressPdf(inputPath, outputPath, options.preset);
    }
    if (IMAGE_EXTENSIONS.has(originalNormalized)) {
      return compressImage(inputPath, outputPath, options.quality || 75, options.resizePercent || 100);
    }
    if (AUDIO_EXTENSIONS.has(originalNormalized) || VIDEO_EXTENSIONS.has(originalNormalized)) {
      return compressAudioOrVideo(inputPath, outputPath, options.quality || 75);
    }
    throw new Error(`Compression is not supported for .${originalNormalized}`);
  }

  if (IMAGE_EXTENSIONS.has(extNormalized) && originalNormalized === 'pdf') {
    return pdfToImage(inputPath, outputPath);
  }

  if (originalNormalized === 'svg' && IMAGE_EXTENSIONS.has(extNormalized)) {
    return svgToImage(inputPath, outputPath);
  }

  if (originalNormalized === 'svg' && extNormalized === 'pdf') {
    return svgToPdf(inputPath, outputPath);
  }

  if (extNormalized === 'svg' && IMAGE_EXTENSIONS.has(originalNormalized)) {
    return imageToSvg(inputPath, outputPath);
  }

  if (IMAGE_EXTENSIONS.has(extNormalized) && IMAGE_EXTENSIONS.has(originalNormalized)) {
    return convertImageToImage(inputPath, outputPath);
  }

  if (AUDIO_EXTENSIONS.has(extNormalized)) {
    return convertAudio(inputPath, outputPath, originalNormalized, extNormalized);
  }

  if (VIDEO_EXTENSIONS.has(extNormalized)) {
    return convertVideo(inputPath, outputPath, originalNormalized, extNormalized);
  }

  if (extNormalized === 'pdf') {
    if (originalNormalized === 'docx') {
      return docxToPdf(inputPath, outputPath);
    }
    if (IMAGE_EXTENSIONS.has(originalNormalized)) {
      return imageToPdf(inputPath, outputPath);
    }
    if (originalNormalized === 'svg') {
      return svgToPdf(inputPath, outputPath);
    }
  }

  if (extNormalized === 'docx') {
    if (originalNormalized === 'pdf') {
      return pdfToDocx(inputPath, outputPath);
    }
    if (IMAGE_EXTENSIONS.has(originalNormalized)) {
      return imageToDocx(inputPath, outputPath);
    }
  }

  throw new Error(`Conversion path .${originalNormalized} → .${extNormalized} is not implemented.`);
}

module.exports = {
  ALLOWED_EXTENSIONS,
  IMAGE_EXTENSIONS,
  AUDIO_EXTENSIONS,
  VIDEO_EXTENSIONS,
  assertConversionSupported,
  convertFile,
  compressImage,
};
