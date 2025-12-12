import JSZip from 'jszip';
import { GeneratedImage } from '../types';

export const exportGalleryToZip = async (
  images: GeneratedImage[],
  onProgress: (percent: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder("Cinematic_Vision_Gallery");
  
  if (!folder) throw new Error("Failed to create zip folder");

  // Sort by timestamp
  const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp);

  let processed = 0;
  
  // Add files
  sortedImages.forEach((img, index) => {
    // Format: IMG_001_PipelineA_Timestamp.png
    const num = (index + 1).toString().padStart(3, '0');
    const pipe = img.pipeline ? `_${img.pipeline}` : '';
    const ratio = img.aspectRatio === '21:9' ? '_Wide' : '_Vert';
    const filename = `IMG_${num}${pipe}${ratio}_${img.timestamp}.png`;

    // Strip the data:image/png;base64, prefix
    const base64Data = img.url.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    
    folder.file(filename, base64Data, { base64: true });
    processed++;
  });

  // Generate Zip
  const content = await zip.generateAsync({ 
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 5 }
  }, (metadata) => {
    onProgress(metadata.percent);
  });

  // Trigger Download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CVE_Gallery_Archive_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};