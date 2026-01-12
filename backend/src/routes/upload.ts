import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp_randomUUID_originalname
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// POST /upload/image - Upload image
router.post(
  '/image',
  authenticateToken,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      console.error(`[UPLOAD] ❌ No file received in request`);
      console.error(`[UPLOAD] Request body:`, req.body);
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const filePath = `/uploads/${req.file.filename}`;
    
    // Construct full URL - use the host from the request (which will be the phone's IP)
    // This ensures the URL works on the phone device
    const protocol = req.protocol || 'http';
    let host = req.get('host') || `localhost:${process.env.PORT || 3000}`;
    
    // If host contains localhost, try to get the actual IP from the request
    // The phone will connect using the computer's IP (e.g., 192.168.100.3:3000)
    // So the host header should already have the correct IP
    // But if it's localhost, we need to replace it
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // Try to get IP from X-Forwarded-For or use the request IP
      const forwardedHost = req.get('x-forwarded-host');
      const forwardedFor = req.get('x-forwarded-for');
      if (forwardedHost && !forwardedHost.includes('localhost')) {
        host = forwardedHost;
      } else if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs, take the first one
        const firstIp = forwardedFor.split(',')[0].trim();
        host = `${firstIp}:${process.env.PORT || 3000}`;
      } else {
        // Use API_URL from env as fallback
        if (process.env.API_URL) {
          const baseUrl = process.env.API_URL.replace('/api', '').replace('http://', '').replace('https://', '');
          host = baseUrl;
        }
      }
    }
    
    const fullUrl = `${protocol}://${host}${filePath}`;

    res.status(201).json({
      message: 'Image uploaded successfully',
      file: {
        id: req.file.filename,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: filePath,
        url: fullUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }
    });
  })
);

// DELETE /upload/image/:filename - Delete image
router.delete(
  '/image/:filename',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Delete file
    try {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  })
);

export default router;
