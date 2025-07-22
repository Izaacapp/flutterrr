import { strictDateExtraction } from "../../utils/dateStrict";
import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import HumanVerificationRequest from '../../models/HumanVerificationRequest';
import { storageService } from '../../services/storage.service';

const router = Router();

interface HumanVerifyRequest {
  imageBase64: string;
  missingFields: string[];
  ocrAttempts: number;
  extractedData?: any;
}

// Submit boarding pass for human verification
router.post('/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const { imageBase64, missingFields, ocrAttempts, extractedData } = req.body as HumanVerifyRequest;
    const userId = req.user?._id;

    if (!imageBase64 || !missingFields || missingFields.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid request - image and missing fields required' 
      });
    }

    // Maximum 3 OCR attempts before human verification
    if (ocrAttempts < 3) {
      return res.status(400).json({ 
        message: 'Please try OCR scanning at least 3 times first',
        attemptsRemaining: 3 - ocrAttempts
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    // Upload image for human review
    const uploadResult = await storageService.upload({
      fieldname: 'boarding_pass',
      originalname: `human_verify_${Date.now()}.jpg`,
      encoding: 'base64',
      mimetype: 'image/jpeg',
      buffer: imageBuffer,
      size: imageBuffer.length
    }, {
      folder: `human-verification/${userId}`
    });

    // Create verification request
    const verificationRequest = new HumanVerificationRequest({
      userId,
      imageUrl: uploadResult.url,
      missingFields,
      extractedData: extractedData || {},
      status: 'pending',
      priority: calculatePriority(missingFields),
      submittedAt: strictDateExtraction()
    });

    await verificationRequest.save();

    // Log for monitoring
    console.log(`Human verification requested by user ${userId} for fields: ${missingFields.join(', ')}`);

    res.json({
      message: 'Boarding pass submitted for human verification',
      requestId: verificationRequest._id,
      estimatedTime: getEstimatedTime(verificationRequest.priority),
      status: 'pending'
    });
  } catch (error) {
    console.error('Human verification submission error:', error);
    res.status(500).json({ message: 'Failed to submit for human verification' });
  }
});

// Check verification status
router.get('/status/:requestId', authenticate, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;

    const request = await HumanVerificationRequest.findOne({
      _id: requestId,
      userId
    });

    if (!request) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    res.json({
      status: request.status,
      completedData: request.completedData,
      completedAt: request.completedAt,
      reviewer: request.reviewer,
      estimatedTime: request.status === 'pending' ? getEstimatedTime(request.priority) : null
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: 'Failed to check verification status' });
  }
});

// Admin: Get pending verifications
router.get('/admin/pending', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pendingRequests = await HumanVerificationRequest.find({
      status: 'pending'
    })
    .sort({ priority: -1, submittedAt: 1 })
    .limit(20)
    .populate('userId', 'email name');

    res.json({
      requests: pendingRequests,
      totalPending: await HumanVerificationRequest.countDocuments({ status: 'pending' })
    });
  } catch (error) {
    console.error('Admin fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch pending requests' });
  }
});

// Admin: Complete verification
router.post('/admin/complete/:requestId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { requestId } = req.params;
    const { completedData } = req.body;

    const request = await HumanVerificationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'completed';
    request.completedData = completedData;
    request.completedAt = strictDateExtraction();
    request.reviewer = req.user._id;
    
    await request.save();

    // TODO: Notify user via websocket or email

    res.json({
      message: 'Verification completed',
      request
    });
  } catch (error) {
    console.error('Admin complete error:', error);
    res.status(500).json({ message: 'Failed to complete verification' });
  }
});

// Helper functions
function calculatePriority(missingFields: string[]): number {
  // Higher priority for critical fields
  const criticalFields = ['departureTime', 'origin', 'destination', 'date'];
  const criticalMissing = missingFields.filter(f => criticalFields.includes(f)).length;
  
  return criticalMissing * 10 + missingFields.length;
}

function getEstimatedTime(priority: number): string {
  if (priority >= 30) return '5-10 minutes';
  if (priority >= 20) return '10-20 minutes';
  if (priority >= 10) return '20-30 minutes';
  return '30-60 minutes';
}

export default router;