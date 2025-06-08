import { prisma } from "../lib/prisma";
import type { GmailMessage, GmailHistoryResponse } from "../types";
import { extractEmailBody, parseEmailHeaders } from "../utils/email-utils";

class GmailService {
	private async fetchGmailMessage(
		accessToken: string,
		messageId: string
	): Promise<GmailMessage | null> {
		try {
			const response = await fetch(
				`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);

			if (!response.ok) {
				console.error(
					`Failed to fetch message ${messageId}: ${response.statusText}`
				);
				return null;
			}

			return await response.json() as GmailMessage;
		} catch (error) {
			console.error(`Error fetching message ${messageId}:`, error);
			return null;
		}
	}

	private async saveEmailToDatabase(messageData: GmailMessage, userId: string) {
		const headers = parseEmailHeaders(messageData.payload.headers);
		const { textBody, htmlBody } = extractEmailBody(messageData.payload);
		const emailDate =
			headers.date || new Date(parseInt(messageData.internalDate));

		await prisma.email.upsert({
			where: { gmailId: messageData.id },
			update: {
				subject: headers.subject,
				from: headers.from,
				senderEmail: headers.senderEmail,
				senderName: headers.senderName,
				to: headers.to,
				toEmails: headers.toEmails,
				cc: headers.cc,
				ccEmails: headers.ccEmails,
				bcc: headers.bcc,
				bccEmails: headers.bccEmails,
				replyTo: headers.replyTo,
				date: emailDate,
				body: textBody || htmlBody,
				textBody,
				htmlBody,
				snippet: messageData.snippet,
				threadId: messageData.threadId,
				messageId: headers.messageId,
				labelIds: messageData.labelIds,
				isRead: !messageData.labelIds.includes("UNREAD"),
				isImportant: messageData.labelIds.includes("IMPORTANT"),
				isStarred: messageData.labelIds.includes("STARRED"),
				sizeEstimate: messageData.sizeEstimate,
			},
			create: {
				userId,
				gmailId: messageData.id,
				subject: headers.subject,
				from: headers.from,
				senderEmail: headers.senderEmail,
				senderName: headers.senderName,
				to: headers.to,
				toEmails: headers.toEmails,
				cc: headers.cc,
				ccEmails: headers.ccEmails,
				bcc: headers.bcc,
				bccEmails: headers.bccEmails,
				replyTo: headers.replyTo,
				date: emailDate,
				body: textBody || htmlBody,
				textBody,
				htmlBody,
				snippet: messageData.snippet,
				threadId: messageData.threadId,
				messageId: headers.messageId,
				labelIds: messageData.labelIds,
				isRead: !messageData.labelIds.includes("UNREAD"),
				isImportant: messageData.labelIds.includes("IMPORTANT"),
				isStarred: messageData.labelIds.includes("STARRED"),
				sizeEstimate: messageData.sizeEstimate,
			},
		});
	}

	async fetchAllEmails(accessToken: string, userId: string): Promise<void> {
		try {
			let nextPageToken: string | undefined;
			let processedCount = 0;
			const maxResults = 100;

			do {
				const url = new URL(
					"https://gmail.googleapis.com/gmail/v1/users/me/messages"
				);
				url.searchParams.append("maxResults", maxResults.toString());
				if (nextPageToken) {
					url.searchParams.append("pageToken", nextPageToken);
				}

				const response = await fetch(url.toString(), {
					headers: { Authorization: `Bearer ${accessToken}` },
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch emails: ${response.statusText}`);
				}

				const data = (await response.json()) as {
					messages?: Array<{ id: string }>;
					nextPageToken?: string;
				};

				nextPageToken = data.nextPageToken;

				if (data.messages?.length) {
					const batchSize = 10;
					for (let i = 0; i < data.messages.length; i += batchSize) {
						const batch = data.messages.slice(i, i + batchSize);

						await Promise.all(
							batch.map(async (message) => {
								const messageData = await this.fetchGmailMessage(
									accessToken,
									message.id
								);
								if (messageData) {
									await this.saveEmailToDatabase(messageData, userId);
								}
							})
						);

						processedCount += batch.length;
						await new Promise((resolve) => setTimeout(resolve, 100));
					}
				}

				if (processedCount >= 10000) break;
			} while (nextPageToken);

			await this.updateUserHistoryId(accessToken, userId);
			console.log(
				`Initial sync completed: ${processedCount} emails processed for user ${userId}`
			);
		} catch (error) {
			console.error("Error in fetchAllEmails:", error);
			throw error;
		}
	}

	async fetchNewEmails(accessToken: string, userId: string): Promise<void> {
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { gmailHistoryId: true },
			});

			if (!user?.gmailHistoryId) {
				console.log("No history ID found, performing full sync");
				await this.fetchAllEmails(accessToken, userId);
				return;
			}

			let startHistoryId = user.gmailHistoryId;
			let nextPageToken: string | undefined;

			do {
				const url = new URL(
					"https://gmail.googleapis.com/gmail/v1/users/me/history"
				);
				url.searchParams.append("startHistoryId", startHistoryId);
				if (nextPageToken) {
					url.searchParams.append("pageToken", nextPageToken);
				}

				const response = await fetch(url.toString(), {
					headers: { Authorization: `Bearer ${accessToken}` },
				});

				if (!response.ok) {
					if (response.status === 404) {
						console.log("History ID expired, performing full sync");
						await this.fetchAllEmails(accessToken, userId);
						return;
					}
					throw new Error(`Failed to fetch history: ${response.statusText}`);
				}

				const data = (await response.json()) as GmailHistoryResponse;
				nextPageToken = data.nextPageToken;

				if (data.history?.length) {
					const newMessageIds = new Set<string>();

					data.history.forEach((historyItem) => {
						historyItem.messagesAdded?.forEach((added) => {
							newMessageIds.add(added.message.id);
						});
					});

					if (newMessageIds.size > 0) {
						const messageIds = Array.from(newMessageIds);
						const batchSize = 10;

						for (let i = 0; i < messageIds.length; i += batchSize) {
							const batch = messageIds.slice(i, i + batchSize);

							await Promise.all(
								batch.map(async (messageId) => {
									const messageData = await this.fetchGmailMessage(
										accessToken,
										messageId
									);
									if (messageData) {
										await this.saveEmailToDatabase(messageData, userId);
									}
								})
							);

							await new Promise((resolve) => setTimeout(resolve, 100));
						}

						console.log(
							`Processed ${messageIds.length} new emails for user ${userId}`
						);
					}
				}

				startHistoryId = data.historyId;
			} while (nextPageToken);

			await prisma.user.update({
				where: { id: userId },
				data: { gmailHistoryId: startHistoryId },
			});
		} catch (error) {
			console.error("Error in fetchNewEmails:", error);
			throw error;
		}
	}

	private async updateUserHistoryId(
		accessToken: string,
		userId: string
	): Promise<void> {
		try {
			const response = await fetch(
				"https://gmail.googleapis.com/gmail/v1/users/me/profile",
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);

			if (response.ok) {
				const profile = (await response.json()) as { historyId: string };
				await prisma.user.update({
					where: { id: userId },
					data: { gmailHistoryId: profile.historyId },
				});
			}
		} catch (error) {
			console.error("Error updating history ID:", error);
		}
	}
}

export const gmailService = new GmailService();
