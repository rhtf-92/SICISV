/**
 * Utility for client-side image compression using an offscreen canvas.
 * Reduces image dimensions to a maximum bounding box and exports as compressed JPEG base64.
 * Prevents QuotaExceededError in localStorage and optimizes API network transfer.
 */
export function compressImage(
  fileOrBase64: File | string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep original dimensions if already smaller than the boundaries
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not retrieve canvas 2D context'));
        return;
      }

      // Draw the scaled image onto the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the canvas to high-performance JPEG base64
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
