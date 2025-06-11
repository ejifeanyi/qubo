import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.modify",
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile",
];

export class GmailService {
	private oauth2Client: OAuth2Client;

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
	}

	private encrypt(text: string): string {
		const iv = crypto.randomBytes(16);
		const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
		const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
		let encrypted = cipher.update(text, "utf8", "hex");
		encrypted += cipher.final("hex");
		return iv.toString('hex') + ':' + encrypted;
	}

	private decrypt(encryptedText: string): string {
		const [ivHex, encryptedData] = encryptedText.split(':');
		const iv = Buffer.from(ivHex, 'hex');
		const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
		const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
		let decrypted = decipher.update(encryptedData, "hex", "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	}

	getAuthUrl(): string {
		return this.oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: SCOPES,
			prompt: "consent",
		});
	}

	async getTokens(code: string) {
		const { tokens } = await this.oauth2Client.getToken(code);
		return tokens;
	}

	async storeTokens(userId: string, tokens: any) {
		const encryptedAccessToken = tokens.access_token
			? this.encrypt(tokens.access_token)
			: null;
		const encryptedRefreshToken = tokens.refresh_token
			? this.encrypt(tokens.refresh_token)
			: null;

		await prisma.user.update({
			where: { id: userId },
			data: {
				accessToken: encryptedAccessToken,
				refreshToken: encryptedRefreshToken,
				tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
			},
		});
	}

    async getGmailClient(userId: string): Promise<gmail_v1.Gmail> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { accessToken: true, refreshToken: true, tokenExpiry: true },
        });

        if (!user?.accessToken) {
            throw new Error("No access token found");
        }

        const accessToken = this.decrypt(user.accessToken);
        const refreshToken = user.refreshToken
            ? this.decrypt(user.refreshToken)
            : null;

        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: user.tokenExpiry?.getTime(),
        });

        if (user.tokenExpiry && user.tokenExpiry < new Date()) {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            await this.storeTokens(userId, credentials);
            this.oauth2Client.setCredentials(credentials);
        }

		return google.gmail({version: 'v1', auth: this.oauth2Client as any});
    }

	async fetchEmails(userId: string, pageToken?: string, maxResults = 50) {
		const gmail = await this.getGmailClient(userId);

		const response = await gmail.users.messages.list({
			userId: "me",
			maxResults,
			pageToken,
			q: "in:inbox OR in:sent",
		});

		return {
			messages: response.data.messages || [],
			nextPageToken: response.data.nextPageToken,
		};
	}

	async getEmailDetails(userId: string, messageId: string) {
		const gmail = await this.getGmailClient(userId);

		const response = await gmail.users.messages.get({
			userId: "me",
			id: messageId,
			format: "full",
		});

		return response.data;
	}

	parseEmailData(emailData: any) {
		const headers = emailData.payload?.headers || [];
		const getHeader = (name: string) =>
			headers.find((h: any) => h.name === name)?.value || "";

		let body = "";
		let bodyText = "";

		const extractBody = (payload: any) => {
			if (payload.body?.data) {
				const decoded = Buffer.from(payload.body.data, "base64").toString(
					"utf-8"
				);
				if (payload.mimeType === "text/html") {
					body = decoded;
				} else if (payload.mimeType === "text/plain") {
					bodyText = decoded;
				}
			}

			if (payload.parts) {
				payload.parts.forEach(extractBody);
			}
		};

		extractBody(emailData.payload);

		return {
			messageId: emailData.id,
			threadId: emailData.threadId,
			subject: getHeader("Subject"),
			from: getHeader("From"),
			to: getHeader("To"),
			cc: getHeader("Cc"),
			bcc: getHeader("Bcc"),
			body,
			bodyText,
			snippet: emailData.snippet,
			labels: emailData.labelIds || [],
			receivedAt: new Date(parseInt(emailData.internalDate)),
			isRead: !emailData.labelIds?.includes("UNREAD"),
			isStarred: emailData.labelIds?.includes("STARRED"),
			gmailData: emailData,
		};
	}

	async bulkSyncEmails(
		userId: string,
		onProgress?: (progress: number, total: number) => void
	) {
		let allEmails: any[] = [];
		let pageToken: string | undefined;
		let totalProcessed = 0;

		await prisma.user.update({
			where: { id: userId },
			data: { syncInProgress: true },
		});

		try {
			do {
				const { messages, nextPageToken } = await this.fetchEmails(
					userId,
					pageToken,
					100
				);

				if (messages.length === 0) break;

				for (let i = 0; i < messages.length; i += 10) {
					const batch = messages.slice(i, i + 10);
					const emailPromises = batch.map(async (msg: any) => {
						try {
							const existingEmail = await prisma.email.findUnique({
								where: { messageId: msg.id },
							});

							if (existingEmail) {
								return null;
							}

							const emailData = await this.getEmailDetails(userId, msg.id);
							return this.parseEmailData(emailData);
						} catch (error) {
							console.error(`Error fetching email ${msg.id}:`, error);
							return null;
						}
					});

					const batchResults = await Promise.all(emailPromises);
					const validEmails = batchResults.filter((email) => email !== null);
					allEmails.push(...validEmails);

					totalProcessed += batch.length;
					onProgress?.(totalProcessed, messages.length);

					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				pageToken = nextPageToken ?? undefined;
			} while (pageToken);

			if (allEmails.length > 0) {
				await prisma.email.createMany({
					data: allEmails.map((email) => ({
						...email,
						userId,
						labels: email.labels || [],
						gmailData: email.gmailData || {},
					})),
					skipDuplicates: true,
				});
			}

			await prisma.user.update({
				where: { id: userId },
				data: {
					syncInProgress: false,
					lastSyncAt: new Date(),
				},
			});

			return { synced: allEmails.length, total: totalProcessed };
		} catch (error) {
			await prisma.user.update({
				where: { id: userId },
				data: { syncInProgress: false },
			});
			throw error;
		}
	}
}
