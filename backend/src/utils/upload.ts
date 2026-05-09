import multer from 'multer';
// upload a file and limit to 5 mbs
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});