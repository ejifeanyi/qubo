export class RateLimiter {
	private requests: number[] = [];
	private maxRequests: number;
	private windowMs: number;

	constructor(maxRequests: number = 250, windowMs: number = 1000) {
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	async waitIfNeeded(): Promise<void> {
		const now = Date.now();

		// Remove old requests outside the time window
		this.requests = this.requests.filter((time) => now - time < this.windowMs);

		if (this.requests.length >= this.maxRequests) {
			// Calculate wait time until oldest request expires
			const oldestRequest = Math.min(...this.requests);
			const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer

			if (waitTime > 0) {
				await new Promise((resolve) => setTimeout(resolve, waitTime));
			}
		}

		this.requests.push(now);
	}
}
