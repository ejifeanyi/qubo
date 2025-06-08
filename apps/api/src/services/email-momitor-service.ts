import { prisma } from "../lib/prisma";
import { gmailService } from "./gmail-service";

class EmailMonitorService {
	private intervals = new Map<string, NodeJS.Timeout>();
	private readonly POLL_INTERVAL = 30000;

	async startMonitoring(userId: string): Promise<void> {
		if (this.intervals.has(userId)) {
			return;
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				googleAccessToken: true,
				googleTokenExpiry: true,
			},
		});

		if (!user?.googleAccessToken) {
			console.log(`No access token for user ${userId}`);
			return;
		}

		if (user.googleTokenExpiry && user.googleTokenExpiry < new Date()) {
			console.log(`Access token expired for user ${userId}`);
			return;
		}

		const interval = setInterval(async () => {
			try {
				await gmailService.fetchNewEmails(user.googleAccessToken!, userId);
			} catch (error) {
				console.error(`Error monitoring emails for user ${userId}:`, error);
				if (this.isTokenError(error)) {
					this.stopMonitoring(userId);
				}
			}
		}, this.POLL_INTERVAL);

		this.intervals.set(userId, interval);
		console.log(`Started email monitoring for user ${userId}`);
	}

	stopMonitoring(userId: string): void {
		const interval = this.intervals.get(userId);
		if (interval) {
			clearInterval(interval);
			this.intervals.delete(userId);
			console.log(`Stopped email monitoring for user ${userId}`);
		}
	}

	isMonitoring(userId: string): boolean {
		return this.intervals.has(userId);
	}

	getActiveMonitors(): string[] {
		return Array.from(this.intervals.keys());
	}

	stopAllMonitoring(): void {
		this.intervals.forEach((interval, userId) => {
			clearInterval(interval);
			console.log(`Stopped monitoring for user ${userId}`);
		});
		this.intervals.clear();
	}

	private isTokenError(error: any): boolean {
		return (
			error?.message?.includes("Invalid token") ||
			error?.message?.includes("Token expired") ||
			error?.message?.includes("unauthorized")
		);
	}
}

export const emailMonitorService = new EmailMonitorService();
