export function compressImage(file, { maxWidth = 1200, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const ratio = img.width / img.height;
          const width = Math.min(maxWidth, img.width);
          const height = Math.round(width / ratio);

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer JPEG for smaller size; preserve PNG if original had transparency
          const hasTransparency = (() => {
            // crude check: if original mime is png, assume transparency possible
            return file.type === 'image/png';
          })();

          const mime = hasTransparency ? 'image/png' : 'image/jpeg';
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            const outFile = new File([blob], file.name.replace(/\.(png|jpg|jpeg)$/i, hasTransparency ? '.png' : '.jpg'), { type: mime });
            resolve(outFile);
          }, mime, quality);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
