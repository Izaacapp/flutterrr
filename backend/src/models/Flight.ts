import { Schema, model, Document } from 'mongoose';
import { FlightStatus, BarcodeData, AirportLocation } from '@my-app/shared';

// Extend the shared Flight interface for MongoDB Document
export interface IFlight extends Document {
  userId: Schema.Types.ObjectId;
  
  // Basic flight info
  airline: string;
  airlineCode?: string;
  airlineLogo?: string;
  flightNumber: string;
  confirmationCode: string;
  eticketNumber?: string;
  
  // Route info
  origin: AirportLocation;
  destination: AirportLocation;
  distance?: number; // in miles
  duration?: number; // in minutes
  
  // Time info
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  boardingTime?: Date;
  
  // Boarding details
  seatNumber: string;
  boardingGroup?: string;
  boardingZone?: string;
  sequenceNumber?: string;
  classOfService?: 'economy' | 'premium-economy' | 'business' | 'first';
  
  // Flight stats
  points?: number; // loyalty points earned
  
  // Documents
  boardingPassUrl?: string; // S3 URL
  barcode?: BarcodeData;
  
  // Status
  status: FlightStatus;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculatePoints(): number;
}

// Airport location sub-schema
const airportLocationSchema = new Schema({
  airportCode: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  airportName: String,
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: false
  },
  terminal: String,
  gate: String
}, { _id: false });

// Barcode sub-schema
const barcodeSchema = new Schema({
  type: {
    type: String,
    enum: ['PDF417', 'QR', 'AZTEC', 'OTHER'],
    required: true
  },
  value: {
    type: String,
    required: true
  }
}, { _id: false });

const flightSchema = new Schema<IFlight>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic flight info
  airline: {
    type: String,
    required: false,
    default: 'Unknown'
  },
  airlineCode: {
    type: String,
    enum: ['AA', 'DL', 'UA', 'WN', 'NK', 'F9', 'B6', 'AS', 'HA', 'OTHER']
  },
  airlineLogo: String,
  flightNumber: {
    type: String,
    required: false,
    default: 'N/A'
  },
  confirmationCode: {
    type: String,
    required: false,
    default: 'MANUAL'
  },
  eticketNumber: String,
  
  // Route info
  origin: {
    type: airportLocationSchema,
    required: true
  },
  destination: {
    type: airportLocationSchema,
    required: true
  },
  distance: Number, // miles
  duration: Number, // minutes
  
  // Time info
  scheduledDepartureTime: {
    type: Date,
    required: true,
    index: true
  },
  scheduledArrivalTime: {
    type: Date,
    required: true
  },
  actualDepartureTime: Date,
  actualArrivalTime: Date,
  boardingTime: Date,
  
  // Boarding details
  seatNumber: {
    type: String,
    required: false,
    default: 'N/A'
  },
  boardingGroup: String,
  boardingZone: String,
  sequenceNumber: String,
  classOfService: {
    type: String,
    enum: ['economy', 'premium-economy', 'business', 'first']
  },
  
  // Flight stats
  points: Number,
  
  // Documents
  boardingPassUrl: String,
  barcode: barcodeSchema,
  
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled', 'delayed', 'in-flight'],
    default: 'upcoming',
    required: true,
    index: true
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for common queries
flightSchema.index({ userId: 1, scheduledDepartureTime: -1 });
flightSchema.index({ userId: 1, status: 1 });
flightSchema.index({ userId: 1, airline: 1 });
flightSchema.index({ 'origin.airportCode': 1, 'destination.airportCode': 1 });

// Calculate points based on distance and class
flightSchema.methods.calculatePoints = function(): number {
  if (!this.distance) return 0;
  
  let basePoints = Math.floor(this.distance);
  
  // Apply class multipliers
  switch (this.classOfService) {
    case 'first':
      basePoints *= 3;
      break;
    case 'business':
      basePoints *= 2;
      break;
    case 'premium-economy':
      basePoints *= 1.5;
      break;
    default:
      // economy stays at 1x
  }
  
  return Math.floor(basePoints);
};

// Pre-save middleware to calculate points
flightSchema.pre('save', function(next) {
  if (this.isModified('distance') || this.isModified('classOfService')) {
    this.points = this.calculatePoints();
  }
  next();
});

export const Flight = model<IFlight>('Flight', flightSchema);
export default Flight;