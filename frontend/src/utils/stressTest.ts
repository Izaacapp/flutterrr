import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { postService } from '../services/post.service';
import authService from '../services/auth.service';

interface StressTestResults {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  operations: {
    type: string;
    success: boolean;
    duration: number;
    error?: string;
  }[];
}

export class StressTest {
  private results: StressTestResults = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageResponseTime: 0,
    operations: []
  };

  async runConcurrentLikeTest(postId: string, iterations: number = 10) {
    console.log(`🚀 Starting concurrent like test with ${iterations} operations...`);
    
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      promises.push(this.timedOperation(
        () => postService.toggleLike(postId),
        `like-${i}`
      ));
    }

    await Promise.all(promises);
    return this.generateReport('Concurrent Like Test');
  }

  async runConcurrentCommentTest(postId: string, iterations: number = 10) {
    console.log(`🚀 Starting concurrent comment test with ${iterations} operations...`);
    
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      promises.push(this.timedOperation(
        () => postService.addComment(postId, `Stress test comment ${i} - ${Date.now()}`),
        `comment-${i}`
      ));
    }

    await Promise.all(promises);
    return this.generateReport('Concurrent Comment Test');
  }

  async runMixedOperationsTest(postIds: string[], iterations: number = 20) {
    console.log(`🚀 Starting mixed operations test with ${iterations} operations...`);
    
    const promises = [];
    
    for (let i = 0; i < iterations; i++) {
      const postId = postIds[Math.floor(Math.random() * postIds.length)];
      const operation = Math.random();
      
      if (operation < 0.4) {
        // 40% likes
        promises.push(this.timedOperation(
          () => postService.toggleLike(postId),
          `like-${i}`
        ));
      } else if (operation < 0.7) {
        // 30% comments
        promises.push(this.timedOperation(
          () => postService.addComment(postId, `Mixed test comment ${i}`),
          `comment-${i}`
        ));
      } else if (operation < 0.9) {
        // 20% shares
        promises.push(this.timedOperation(
          () => postService.sharePost(postId),
          `share-${i}`
        ));
      } else {
        // 10% create posts
        promises.push(this.timedOperation(
          () => postService.createPost({
            content: `Stress test post ${i} - ${Date.now()}`,
            images: []
          }),
          `create-${i}`
        ));
      }
    }

    await Promise.all(promises);
    return this.generateReport('Mixed Operations Test');
  }

  async runRapidFireTest(postId: string, duration: number = 5000) {
    console.log(`🚀 Starting rapid fire test for ${duration}ms...`);
    
    const startTime = Date.now();
    const promises = [];
    let operationCount = 0;
    const BATCH_SIZE = 50; // Process in smaller batches
    const BATCH_DELAY = 100; // Delay between batches

    while (Date.now() - startTime < duration) {
      const batch = [];
      
      // Create a batch of requests
      for (let i = 0; i < BATCH_SIZE && Date.now() - startTime < duration; i++) {
        batch.push(this.timedOperation(
          () => postService.toggleLike(postId),
          `rapid-${operationCount++}`
        ));
      }
      
      // Process the batch
      promises.push(...batch);
      
      // Add delay between batches to avoid overwhelming the server
      if (Date.now() - startTime < duration) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    await Promise.all(promises);
    return this.generateReport('Rapid Fire Test');
  }

  async runAuthenticationStressTest(iterations: number = 5) {
    console.log(`🚀 Starting authentication stress test with ${iterations} operations...`);
    
    const testEmail = `stresstest${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    // Register
    await this.timedOperation(
      () => authService.signup(
        `stressuser${Date.now()}`,
        testEmail,
        testPassword,
        'Stress Test User'
      ),
      'register'
    );

    // Multiple login attempts
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      promises.push(this.timedOperation(
        () => authService.login(testEmail, testPassword),
        `login-${i}`
      ));
    }

    await Promise.all(promises);
    return this.generateReport('Authentication Stress Test');
  }

  private async timedOperation(
    operation: () => Promise<any>,
    operationName: string
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      await operation();
      const duration = performance.now() - startTime;
      
      this.results.operations.push({
        type: operationName,
        success: true,
        duration
      });
      
      this.results.successfulOperations++;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.operations.push({
        type: operationName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      this.results.failedOperations++;
    }
    
    this.results.totalOperations++;
  }

  private generateReport(testName: string): StressTestResults {
    // Calculate average response time
    const totalTime = this.results.operations.reduce(
      (sum, op) => sum + op.duration, 
      0
    );
    this.results.averageResponseTime = totalTime / this.results.operations.length;

    // Log report
    console.log(`\n📊 ${testName} Results:`);
    console.log(`Total Operations: ${this.results.totalOperations}`);
    console.log(`✅ Successful: ${this.results.successfulOperations}`);
    console.log(`❌ Failed: ${this.results.failedOperations}`);
    console.log(`⏱️  Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Success Rate: ${((this.results.successfulOperations / this.results.totalOperations) * 100).toFixed(2)}%`);

    // Log failed operations
    const failedOps = this.results.operations.filter(op => !op.success);
    if (failedOps.length > 0) {
      console.log('\n❌ Failed Operations:');
      failedOps.forEach(op => {
        console.log(`  - ${op.type}: ${op.error} (${op.duration.toFixed(2)}ms)`);
      });
    }

    // Log slowest operations
    const slowestOps = [...this.results.operations]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    console.log('\n🐌 Slowest Operations:');
    slowestOps.forEach(op => {
      console.log(`  - ${op.type}: ${op.duration.toFixed(2)}ms ${op.success ? '✅' : '❌'}`);
    });

    return this.results;
  }

  reset() {
    this.results = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0,
      operations: []
    };
  }
}

// Export singleton instance
export const stressTest = new StressTest();

// Window global for console access
if (typeof window !== 'undefined') {
  (window as any).stressTest = stressTest;
}