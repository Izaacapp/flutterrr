import { Schema, model, Document } from 'mongoose';

export interface IFlight extends Document {
  userId: Schema.Types.ObjectId;
  
  // Basic flight info
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  confirmationCode: string;
  eticketNumber?: string;
  
  // Route info
  origin: {
    airportCode: string;
    airportName?: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
  };
  destination: {
    airportCode: string;
    airportName?: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
  };
  
  // Time info
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  
  // Seat info
  seatNumber?: string;
  boardingGroup?: string;
  
  // Flight stats
  distance?: number; // in miles
  duration?: number; // in minutes
  points?: number; // calculated points
  
  // Boarding pass
  boardingPassUrl?: string; // stored in S3
  barcode?: {
    type: 'QR_CODE' | 'PDF417' | 'AZTEC' | 'DATA_MATRIX';
    value: string;
  };
  
  // Status
  status: 'upcoming' | 'completed' | 'cancelled' | 'delayed';
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculatePoints(): number;
}

const flightSchema = new Schema<IFlight>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  airline: {
    type: String,
    required: true,
    enum: ['Delta', 'American', 'United', 'Southwest', 'Spirit', 'Frontier', 'JetBlue', 'Alaska', 'Hawaiian', 'Other']
  },
  airlineLogo: String,
  flightNumber: {
    type: String,
    required: true
  },
  confirmationCode: {
    type: String,
    required: true
  },
  eticketNumber: String,
  
  origin: {
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
      required: true
    },
    terminal: String,
    gate: String
  },
  
  destination: {
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
      required: true
    },
    terminal: String,
    gate: String
  },
  
  scheduledDepartureTime: {
    type: Date,
    required: true
  },
  scheduledArrivalTime: {
    type: Date,
    required: true
  },
  actualDepartureTime: Date,
  actualArrivalTime: Date,
  
  seatNumber: String,
  boardingGroup: String,
  
  distance: Number,
  duration: Number,
  points: Number,
  
  boardingPassUrl: String,
  barcode: {
    type: {
      type: String,
      enum: ['QR_CODE', 'PDF417', 'AZTEC', 'DATA_MATRIX']
    },
    value: String
  },
  
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled', 'delayed'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
flightSchema.index({ userId: 1, scheduledDepartureTime: -1 });
flightSchema.index({ userId: 1, status: 1 });
flightSchema.index({ confirmationCode: 1, userId: 1 });

// Virtual for flight duration in hours
flightSchema.virtual('durationInHours').get(function() {
  if (this.duration) {
    return Math.round(this.duration / 60 * 10) / 10; // Round to 1 decimal
  }
  return null;
});

// Method to calculate points based on distance and class
flightSchema.methods.calculatePoints = function() {
  if (!this.distance) return 0;
  
  // Base points equal to miles traveled
  // Could add multipliers based on airline status or other factors in the future
  return Math.round(this.distance);
};

const Flight = model<IFlight>('Flight', flightSchema);

export default Flight;