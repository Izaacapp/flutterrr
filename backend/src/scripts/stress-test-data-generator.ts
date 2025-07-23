import mongoose from 'mongoose';
import { Flight } from '../models/Flight';
import { User } from '../models/User';
import { Post } from '../models/Post';
import bcrypt from 'bcryptjs';

// Comprehensive test data generator for stress testing
export class StressTestDataGenerator {
  private airlines = [
    { name: 'American Airlines', code: 'AA' },
    { name: 'Delta Air Lines', code: 'DL' },
    { name: 'United Airlines', code: 'UA' },
    { name: 'Southwest Airlines', code: 'WN' },
    { name: 'JetBlue Airways', code: 'B6' },
    { name: 'Alaska Airlines', code: 'AS' }
  ];

  private airports = [
    { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
    { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
    { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States' },
    { code: 'ORD', name: 'O\'Hare International', city: 'Chicago', country: 'United States' },
    { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States' },
    { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States' },
    { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'United States' },
    { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'United States' }
  ];

  private statuses = ['upcoming', 'completed', 'cancelled', 'delayed', 'in-flight'] as const;
  private classes = ['economy', 'premium-economy', 'business', 'first'] as const;

  private getRandomElement<T>(array: readonly T[] | T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private generateConfirmationCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private generateSeatNumber(): string {
    const row = Math.floor(Math.random() * 40) + 1;
    const seat = this.getRandomElement(['A', 'B', 'C', 'D', 'E', 'F']);
    return `${row}${seat}`;
  }

  async generateStressTestUsers(count: number = 100): Promise<any[]> {
    console.log(`🔥 Generating ${count} stress test users...`);
    
    const users = [];
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    for (let i = 0; i < count; i++) {
      const user = {
        username: `stressuser${i}`,
        email: `stresstest${i}@example.com`,
        password: hashedPassword,
        isEmailVerified: true,
        profile: {
          displayName: `Stress User ${i}`,
          bio: `Generated stress test user #${i}`,
          location: this.getRandomElement(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
          website: `https://stresstest${i}.example.com`
        },
        preferences: {
          emailNotifications: Math.random() > 0.5,
          pushNotifications: Math.random() > 0.5,
          theme: this.getRandomElement(['light', 'dark', 'auto'])
        }
      };
      
      users.push(user);
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Generated ${createdUsers.length} stress test users`);
    return createdUsers;
  }

  async generateStressTestFlights(users: any[], flightsPerUser: number = 10): Promise<any[]> {
    console.log(`🔥 Generating ${users.length * flightsPerUser} stress test flights...`);
    
    const flights = [];
    const now = new Date();
    const past = new Date(now.getFullYear() - 2, 0, 1);
    const future = new Date(now.getFullYear() + 1, 11, 31);
    
    for (const user of users) {
      for (let i = 0; i < flightsPerUser; i++) {
        const airline = this.getRandomElement(this.airlines);
        const origin = this.getRandomElement(this.airports);
        let destination = this.getRandomElement(this.airports);
        
        // Ensure origin and destination are different
        while (destination.code === origin.code) {
          destination = this.getRandomElement(this.airports);
        }
        
        const departureTime = this.getRandomDate(past, future);
        const flightDuration = Math.floor(Math.random() * 480) + 60; // 1-8 hours
        const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60000);
        
        // Calculate realistic distance (rough estimate)
        const distance = Math.floor(Math.random() * 2500) + 200; // 200-2700 miles
        
        const flight: any = {
          userId: user._id,
          airline: airline.name,
          airlineCode: airline.code,
          flightNumber: `${airline.code}${Math.floor(Math.random() * 9999) + 1}`,
          confirmationCode: this.generateConfirmationCode(),
          eticketNumber: `E${Math.random().toString().substr(2, 10)}`,
          
          origin: {
            airportCode: origin.code,
            airportName: origin.name,
            city: origin.city,
            country: origin.country,
            terminal: Math.floor(Math.random() * 5) + 1,
            gate: `${this.getRandomElement(['A', 'B', 'C'])}${Math.floor(Math.random() * 20) + 1}`
          },
          
          destination: {
            airportCode: destination.code,
            airportName: destination.name,
            city: destination.city,
            country: destination.country,
            terminal: Math.floor(Math.random() * 5) + 1,
            gate: `${this.getRandomElement(['A', 'B', 'C'])}${Math.floor(Math.random() * 20) + 1}`
          },
          
          scheduledDepartureTime: departureTime,
          scheduledArrivalTime: arrivalTime,
          actualDepartureTime: Math.random() > 0.7 ? new Date(departureTime.getTime() + (Math.random() - 0.5) * 3600000) : undefined,
          actualArrivalTime: Math.random() > 0.7 ? new Date(arrivalTime.getTime() + (Math.random() - 0.5) * 3600000) : undefined,
          
          seatNumber: this.generateSeatNumber(),
          boardingGroup: this.getRandomElement(['1', '2', '3', '4', '5', 'A', 'B']),
          boardingZone: Math.floor(Math.random() * 6) + 1,
          classOfService: this.getRandomElement(this.classes),
          
          distance,
          duration: flightDuration,
          points: Math.floor(distance * 2), // Base points calculation
          
          status: this.getRandomElement(this.statuses),
          notes: Math.random() > 0.8 ? `Stress test flight #${i} notes` : undefined
        };
        
        flights.push(flight);
      }
    }
    
    const createdFlights = await Flight.insertMany(flights);
    console.log(`✅ Generated ${createdFlights.length} stress test flights`);
    return createdFlights;
  }

  async generateStressTestPosts(users: any[], postsPerUser: number = 20): Promise<any[]> {
    console.log(`🔥 Generating ${users.length * postsPerUser} stress test posts...`);
    
    const posts = [];
    const sampleContent = [
      "Just landed in an amazing city! ✈️ #travel",
      "Airport coffee hits different at 5 AM ☕",
      "Window seat views never get old 🌅",
      "Flight delayed but making the best of it 😅",
      "First class upgrade! Living the dream 🥂",
      "Red eye flights are brutal but so worth it 😴",
      "Collecting passport stamps like Pokemon cards 📔",
      "Travel day stress level: maximum ⚡",
      "Found the best airport lounge ever! 🛋️",
      "Boarding now! Next stop: adventure 🎒"
    ];
    
    for (const user of users) {
      for (let i = 0; i < postsPerUser; i++) {
        const post: any = {
          content: this.getRandomElement(sampleContent),
          author: user._id,
          tags: Math.random() > 0.5 ? this.getRandomElement([
            ['travel', 'airport'], 
            ['flight', 'vacation'], 
            ['wanderlust', 'explore'],
            ['aviation', 'journey']
          ]) : [],
          location: Math.random() > 0.6 ? {
            name: this.getRandomElement(['JFK Airport', 'LAX Terminal', 'Chicago O\'Hare', 'Miami International']),
            coordinates: {
              lat: Math.random() * 180 - 90,
              lng: Math.random() * 360 - 180
            }
          } : undefined,
          privacy: this.getRandomElement(['public', 'friends', 'private']),
          likes: [],
          comments: [],
          createdAt: this.getRandomDate(new Date(2023, 0, 1), new Date())
        };
        
        // Add some random likes
        const likeCount = Math.floor(Math.random() * 50);
        for (let j = 0; j < likeCount; j++) {
          const randomUser = this.getRandomElement(users);
          if (!post.likes.includes(randomUser._id)) {
            post.likes.push(randomUser._id);
          }
        }
        
        posts.push(post);
      }
    }
    
    const createdPosts = await Post.insertMany(posts);
    console.log(`✅ Generated ${createdPosts.length} stress test posts`);
    return createdPosts;
  }

  async cleanupStressTestData(): Promise<void> {
    console.log('🧹 Cleaning up stress test data...');
    
    await User.deleteMany({ username: { $regex: /^stressuser\d+$/ } });
    await Flight.deleteMany({ confirmationCode: { $regex: /^[A-Z0-9]{6}$/ } });
    await Post.deleteMany({ content: { $regex: /stress test|airport coffee|window seat/i } });
    
    console.log('✅ Stress test data cleaned up');
  }

  async generateFullStressTestDataset(): Promise<{
    users: any[];
    flights: any[];
    posts: any[];
  }> {
    console.log('🚀 GENERATING FULL STRESS TEST DATASET 🚀');
    console.log('========================================');
    
    try {
      const users = await this.generateStressTestUsers(50);
      const flights = await this.generateStressTestFlights(users, 15);
      const posts = await this.generateStressTestPosts(users, 25);
      
      console.log('');
      console.log('📊 STRESS TEST DATASET COMPLETE:');
      console.log(`👥 Users: ${users.length}`);
      console.log(`✈️  Flights: ${flights.length}`);
      console.log(`📱 Posts: ${posts.length}`);
      console.log('========================================');
      
      return { users, flights, posts };
    } catch (error) {
      console.error('❌ Error generating stress test data:', error);
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new StressTestDataGenerator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'generate':
      generator.generateFullStressTestDataset()
        .then(() => {
          console.log('✅ Stress test data generation complete!');
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Error:', err);
          process.exit(1);
        });
      break;
      
    case 'cleanup':
      generator.cleanupStressTestData()
        .then(() => {
          console.log('✅ Cleanup complete!');
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Error:', err);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: node stress-test-data-generator.js [generate|cleanup]');
      process.exit(1);
  }
}