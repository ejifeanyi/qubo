export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;

	const cookies = document.cookie.split(";");
	const authCookie = cookies.find((cookie) =>
		cookie.trim().startsWith("auth-token=")
	);

	return authCookie ? authCookie.split("=")[1] : null;
}

export function removeAuthToken(): void {
	if (typeof window === "undefined") return;

	document.cookie =
		"auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function isAuthenticated(): boolean {
	return getAuthToken() !== null;
}
