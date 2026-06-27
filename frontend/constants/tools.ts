export interface ToolItem {
  name: string;
  id: string;
  from?: string;
  to?: string;
}

export interface ToolCategory {
  name: string;
  icon: string;
  items: ToolItem[];
}

export const TOOLS_DATA: Record<string, ToolCategory[]> = {
  Convert: [
    {
      name: "Video & Audio",
      icon: "video",
      items: [
        { name: "Video Converter", id: "video-converter" },
        { name: "Audio Converter", id: "audio-converter" },
        { name: "MP3 Converter", id: "mp3-converter", to: "mp3" },
        { name: "MP4 to MP3", id: "mp4-to-mp3", from: "mp4", to: "mp3" },
        { name: "Video to MP3", id: "video-to-mp3", to: "mp3" },
        { name: "MP4 Converter", id: "mp4-converter", to: "mp4" },
        { name: "MOV to MP4", id: "mov-to-mp4", from: "mov", to: "mp4" },
        { name: "MP3 to OGG", id: "mp3-to-ogg", from: "mp3", to: "ogg" },
      ],
    },
    {
      name: "Image",
      icon: "image",
      items: [
        { name: "Image Converter", id: "image-converter" },
        { name: "WEBP to PNG", id: "webp-to-png", from: "webp", to: "png" },
        { name: "JFIF to PNG", id: "jfif-to-png", from: "jfif", to: "png" },
        { name: "PNG to SVG", id: "png-to-svg", from: "png", to: "svg" },
        { name: "HEIC to JPG", id: "heic-to-jpg", from: "heic", to: "jpg" },
        { name: "HEIC to PNG", id: "heic-to-png", from: "heic", to: "png" },
        { name: "WEBP to JPG", id: "webp-to-jpg", from: "webp", to: "jpg" },
        { name: "SVG Converter", id: "svg-converter", to: "svg" },
      ],
    },
    {
      name: "PDF & Documents",
      icon: "file-text",
      items: [
        { name: "PDF Converter", id: "pdf-converter" },
        { name: "Document Converter", id: "document-converter" },
        { name: "PDF to Word", id: "pdf-to-word", from: "pdf", to: "docx" },
        { name: "PDF to JPG", id: "pdf-to-jpg", from: "pdf", to: "jpg" },
        { name: "HEIC to PDF", id: "heic-to-pdf", from: "heic", to: "pdf" },
        { name: "DOCX to PDF", id: "docx-to-pdf", from: "docx", to: "pdf" },
        { name: "JPG to PDF", id: "jpg-to-pdf", from: "jpg", to: "pdf" },
      ],
    },
    {
      name: "GIF",
      icon: "image",
      items: [
        { name: "Video to GIF", id: "video-to-gif", to: "gif" },
        { name: "MP4 to GIF", id: "mp4-to-gif", from: "mp4", to: "gif" },
        { name: "WEBM to GIF", id: "webm-to-gif", from: "webm", to: "gif" },
        { name: "APNG to GIF", id: "apng-to-gif", from: "apng", to: "gif" },
        { name: "GIF to MP4", id: "gif-to-mp4", from: "gif", to: "mp4" },
        { name: "GIF to APNG", id: "gif-to-apng", from: "gif", to: "apng" },
        { name: "Image to GIF", id: "image-to-gif", to: "gif" },
        { name: "MOV to GIF", id: "mov-to-gif", from: "mov", to: "gif" },
        { name: "AVI to GIF", id: "avi-to-gif", from: "avi", to: "gif" },
      ],
    },
    {
      name: "Others",
      icon: "box",
      items: [
        { name: "Unit Converter", id: "unit-converter" },
        { name: "Time Converter", id: "time-converter" },
        { name: "Archive Converter", id: "archive-converter" },
      ],
    },
  ],
  Compress: [
    {
      name: "Video & Audio",
      icon: "video",
      items: [
        { name: "Video Compressor", id: "video-compressor" },
        { name: "MP3 Compressor", id: "mp3-compressor", from: "mp3" },
        { name: "WAV Compressor", id: "wav-compressor", from: "wav" },
      ],
    },
    {
      name: "Image",
      icon: "image",
      items: [
        { name: "Image Compressor", id: "image-compressor" },
        { name: "JPEG Compressor", id: "jpeg-compressor", from: "jpg" },
        { name: "PNG Compressor", id: "png-compressor", from: "png" },
      ],
    },
    {
      name: "PDF & Documents",
      icon: "file-text",
      items: [
        { name: "PDF Compressor", id: "pdf-compressor", from: "pdf" },
      ],
    },
    {
      name: "GIF",
      icon: "image",
      items: [
        { name: "GIF Compressor", id: "gif-compressor", from: "gif" },
      ],
    }
  ],
  Tools: [
    {
      name: "PDF",
      icon: "file-text",
      items: [
        { name: "PDF Editor", id: "pdf-editor" },
      ]
    }
  ]
};

export const ALL_TOOLS: ToolItem[] = Object.values(TOOLS_DATA)
  .flatMap((categories) => categories)
  .flatMap((category) => category.items);

export function getToolById(toolId: string): ToolItem | undefined {
  return ALL_TOOLS.find((tool) => tool.id === toolId);
}
