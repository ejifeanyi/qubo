export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;

	try {
		const cookies = document.cookie.split(";");
		const authCookie = cookies.find((cookie) =>
			cookie.trim().startsWith("auth-token=")
		);
		return authCookie ? authCookie.split("=")[1] : null;
	} catch (error) {
		console.error("Error accessing cookies:", error);
		return null;
	}
}

export function removeAuthToken(): void {
	if (typeof window === "undefined") return;

	try {
		document.cookie =
			"auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
	} catch (error) {
		console.error("Error removing auth token:", error);
	}
}

export function isAuthenticated(): boolean {
	if (typeof window === "undefined") return false;
	return getAuthToken() !== null;
}
