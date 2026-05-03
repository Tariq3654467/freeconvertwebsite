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
        { name: "PNG to JPG", id: "png-to-jpg", from: "png", to: "jpg" },
        { name: "JPG to PNG", id: "jpg-to-png", from: "jpg", to: "png" },
        { name: "SVG to PNG", id: "svg-to-png", from: "svg", to: "png" },
      ],
    },
    {
      name: "PDF & Documents",
      icon: "file-text",
      items: [
        { name: "PDF to Word", id: "pdf-to-word", from: "pdf", to: "docx" },
        { name: "Word to PDF", id: "word-to-pdf", from: "docx", to: "pdf" },
        { name: "PDF to JPG", id: "pdf-to-jpg", from: "pdf", to: "jpg" },
        { name: "Compress PDF", id: "compress-pdf" },
      ],
    },
  ],
  Compress: [
    {
      name: "Video & Audio",
      icon: "video",
      items: [
        { name: "Video Compressor", id: "video-compressor" },
        { name: "Audio Compressor", id: "audio-compressor" },
        { name: "MP4 Compressor", id: "mp4-compressor", from: "mp4" },
      ],
    },
    {
      name: "Image",
      icon: "image",
      items: [
        { name: "PNG Compressor", id: "png-compressor", from: "png" },
        { name: "JPG Compressor", id: "jpg-compressor", from: "jpg" },
      ],
    },
    {
      name: "PDF & Documents",
      icon: "file-text",
      items: [
        { name: "PDF Compressor", id: "pdf-compressor", from: "pdf" },
      ],
    },
  ],
};

export const ALL_TOOLS: ToolItem[] = Object.values(TOOLS_DATA)
  .flatMap((categories) => categories)
  .flatMap((category) => category.items);

export function getToolById(toolId: string): ToolItem | undefined {
  return ALL_TOOLS.find((tool) => tool.id === toolId);
}
