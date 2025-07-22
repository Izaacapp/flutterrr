import { safeStrictDateExtraction } from "../utils/dateStrict";
import express, { Request, Response } from 'express';
import { validateBoardingPass } from '../utils/boardingPassValidator';
import { parseBoardingPassWithSimpletex } from '../utils/boardingPassSimpletex';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// Create validation router
export const validationRouter = express.Router();

// Validation endpoint for text
validationRouter.post('/validate/text', (req: Request, res: Response) => {
  try {
    const { text, confidence } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    const validation = validateBoardingPass({
      text,
      confidence
    });
    
    // Add processing time
    const result = {
      ...validation,
      processingTime: Date.now(),
      version: '1.0.0'
    };
    
    res.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Validation endpoint for images
validationRouter.post('/validate/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Use SimpleTex OCR with validation
    const result = await parseBoardingPassWithSimpletex(file.buffer, file.mimetype);
    
    if (!result) {
      return res.status(422).json({ 
        error: 'Could not extract boarding pass data',
        suggestions: {
          tips: [
            'Ensure the image is clear and well-lit',
            'Avoid glare and shadows',
            'Keep the boarding pass flat',
            'Capture the entire boarding pass'
          ]
        }
      });
    }
    
    res.json({
      extractedData: result,
      processingTime: Date.now(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Image validation error:', error);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// Health check endpoint
validationRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    capabilities: {
      textValidation: true,
      imageValidation: true,
      airlineCodes: true,
      airportValidation: true,
      timeCorrection: true,
      confidenceScoring: true
    }
  });
});

// Get supported airlines
validationRouter.get('/airlines', (req: Request, res: Response) => {
  const { testHelpers } = require('../utils/boardingPassValidator');
  res.json({
    airlines: testHelpers.AIRLINE_CODES,
    total: Object.keys(testHelpers.AIRLINE_CODES).length
  });
});

// Get common airports
validationRouter.get('/airports', (req: Request, res: Response) => {
  const { testHelpers } = require('../utils/boardingPassValidator');
  res.json({
    airports: Array.from(testHelpers.COMMON_AIRPORTS),
    total: testHelpers.COMMON_AIRPORTS.size
  });
});