export type { AppRouter } from "../routers";

export interface User {
	id: string;
	email: string;
	name: string | null;
	picture: string | null;
	createdAt: Date;
}

export interface AuthResponse {
	success: boolean;
	user: {
		id: string;
		email: string;
		name: string | null;
		picture: string | null;
	};
	token: string;
}

export interface GoogleUser {
	googleId: string;
	email: string;
	name: string;
	picture?: string;
	emailVerified?: boolean;
}

export interface Email {
	id: string;
	userId: string;
	gmailId: string;
	subject: string | null;
	from: string | null;
	senderEmail: string | null;
	senderName: string | null;
	to: string | null;
	toEmails: string[];
	cc: string | null;
	ccEmails: string[];
	bcc: string | null;
	bccEmails: string[];
	replyTo: string | null;
	date: Date | null;
	body: string | null;
	textBody: string | null;
	htmlBody: string | null;
	snippet: string | null;
	threadId: string | null;
	messageId: string | null;
	labelIds: string[];
	isRead: boolean;
	isImportant: boolean;
	isStarred: boolean;
	sizeEstimate: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface GmailMessage {
	id: string;
	threadId: string;
	labelIds: string[];
	snippet: string;
	payload: {
		headers: Array<{ name: string; value: string }>;
		parts?: any[];
		body?: any;
		mimeType?: string;
	};
	internalDate: string;
	sizeEstimate: number;
}

export interface GmailHistoryResponse {
	history: Array<{
		id: string;
		messages?: Array<{ id: string }>;
		messagesAdded?: Array<{ message: { id: string } }>;
		messagesDeleted?: Array<{ message: { id: string } }>;
	}>;
	nextPageToken?: string;
	historyId: string;
}
