import { emailMonitorService } from "./services/email-momitor-service";

class SessionManager {
	private activeSessions = new Set<string>();
	private sessionTimeouts = new Map<string, NodeJS.Timeout>();
	private readonly SESSION_TIMEOUT = 15 * 60 * 1000;

	addSession(userId: string): void {
		if (this.activeSessions.has(userId)) {
			this.refreshSession(userId);
			return;
		}

		this.activeSessions.add(userId);
		emailMonitorService.startMonitoring(userId);
		this.setSessionTimeout(userId);

		console.log(`User ${userId} session started`);
	}

	refreshSession(userId: string): void {
		if (!this.activeSessions.has(userId)) {
			this.addSession(userId);
			return;
		}

		this.clearSessionTimeout(userId);
		this.setSessionTimeout(userId);
	}

	removeSession(userId: string): void {
		if (!this.activeSessions.has(userId)) {
			return;
		}

		this.activeSessions.delete(userId);
		this.clearSessionTimeout(userId);
		emailMonitorService.stopMonitoring(userId);

		console.log(`User ${userId} session ended`);
	}

	isActive(userId: string): boolean {
		return this.activeSessions.has(userId);
	}

	getActiveSessions(): string[] {
		return Array.from(this.activeSessions);
	}

	private setSessionTimeout(userId: string): void {
		const timeout = setTimeout(() => {
			this.removeSession(userId);
		}, this.SESSION_TIMEOUT);

		this.sessionTimeouts.set(userId, timeout);
	}

	private clearSessionTimeout(userId: string): void {
		const timeout = this.sessionTimeouts.get(userId);
		if (timeout) {
			clearTimeout(timeout);
			this.sessionTimeouts.delete(userId);
		}
	}

	cleanup(): void {
		this.activeSessions.forEach((userId) => {
			this.removeSession(userId);
		});
	}
}

export const sessionManager = new SessionManager();
