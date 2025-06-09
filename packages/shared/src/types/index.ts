export interface User {
	id: string;
	email: string;
	name?: string | null;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Email {
	id: string;
	messageId: string;
	subject: string;
	from: string;
	to: string;
	body?: string | null;
	snippet?: string | null;
	isRead: boolean;
	isStarred: boolean;
	receivedAt: Date;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
	categoryId?: string | null;
	category?: Category | null;
}

export interface Category {
	id: string;
	name: string;
	color: string;
	description?: string | null;
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
}

export interface AuthResponse {
	token: string;
	user: Pick<User, "id" | "email" | "name" | "image">;
}
