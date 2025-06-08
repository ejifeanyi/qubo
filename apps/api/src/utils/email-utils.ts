function decodeBase64Url(str: string): string {
	try {
		const padding = "=".repeat((4 - (str.length % 4)) % 4);
		const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + padding;
		return Buffer.from(base64, "base64").toString("utf-8");
	} catch (error) {
		console.error("Error decoding base64url:", error);
		return "";
	}
}

function extractEmailBody(payload: any): {
	textBody: string;
	htmlBody: string;
} {
	let textBody = "";
	let htmlBody = "";

	function extractFromPart(part: any) {
		if (part.mimeType === "text/plain" && part.body?.data) {
			textBody = decodeBase64Url(part.body.data);
		} else if (part.mimeType === "text/html" && part.body?.data) {
			htmlBody = decodeBase64Url(part.body.data);
		} else if (part.parts) {
			part.parts.forEach(extractFromPart);
		}
	}

	if (payload.body?.data) {
		if (payload.mimeType === "text/plain") {
			textBody = decodeBase64Url(payload.body.data);
		} else if (payload.mimeType === "text/html") {
			htmlBody = decodeBase64Url(payload.body.data);
		}
	}

	if (payload.parts) {
		payload.parts.forEach(extractFromPart);
	}

	return { textBody, htmlBody };
}

function extractEmailAddress(headerValue: string): string {
	const emailMatch = headerValue.match(/<([^>]+)>/);
	return emailMatch ? emailMatch[1] : headerValue.trim();
}

function extractDisplayName(headerValue: string): string {
	const nameMatch = headerValue.match(/^(.+?)\s*</);
	if (nameMatch) {
		return nameMatch[1].replace(/"/g, "").trim();
	}
	return headerValue.includes("@") ? "" : headerValue.trim();
}

function parseEmailHeaders(headers: Array<{ name: string; value: string }>) {
	const headerMap = headers.reduce(
		(acc, header) => {
			acc[header.name.toLowerCase()] = header.value;
			return acc;
		},
		{} as Record<string, string>
	);

	const fromHeader = headerMap.from || "";
	const toHeader = headerMap.to || "";
	const ccHeader = headerMap.cc || "";
	const bccHeader = headerMap.bcc || "";

	return {
		subject: headerMap.subject || "",
		from: fromHeader,
		senderEmail: extractEmailAddress(fromHeader),
		senderName: extractDisplayName(fromHeader),
		to: toHeader,
		toEmails: toHeader
			.split(",")
			.map((email) => extractEmailAddress(email.trim()))
			.filter(Boolean),
		cc: ccHeader,
		ccEmails: ccHeader
			? ccHeader
					.split(",")
					.map((email) => extractEmailAddress(email.trim()))
					.filter(Boolean)
			: [],
		bcc: bccHeader,
		bccEmails: bccHeader
			? bccHeader
					.split(",")
					.map((email) => extractEmailAddress(email.trim()))
					.filter(Boolean)
			: [],
		replyTo: headerMap["reply-to"] || "",
		messageId: headerMap["message-id"] || "",
		date: headerMap.date ? new Date(headerMap.date) : null,
	};
}

export {
	decodeBase64Url,
	extractEmailBody,
	extractEmailAddress,
	extractDisplayName,
	parseEmailHeaders,
};
