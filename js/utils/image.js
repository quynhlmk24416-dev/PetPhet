/** Helpers for images picked from the user's device (pet avatars). */

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_SIDE_PX = 400;

/** Returns a Vietnamese error message, or null when the file can be used. Accepts any {type, size} object. */
export function validateImageFile(file) {
  if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Chỉ hỗ trợ ảnh PNG, JPG hoặc WebP.';
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 5 MB.';
  }
  return null;
}

/** Size after scaling so the longest side is at most `maxSide` (never enlarges). */
export function fitWithin(width, height, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không đọc được ảnh.'));
    };
    image.src = objectUrl;
  });
}

/**
 * Reads an uploaded image, scales it down and returns a JPEG data URL.
 * Scaling keeps each avatar around tens of KB so many pets still fit in localStorage.
 */
export async function resizeImageToDataUrl(file, maxSide = AVATAR_MAX_SIDE_PX, quality = 0.85) {
  const image = await loadImage(file);
  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff'; // transparent PNG areas become white instead of black in JPEG
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}
