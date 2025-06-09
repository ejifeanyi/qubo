// Updated AuthCallback component
"use client";

import { trpc } from "@/app/lib/trpc";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallback() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);

	const googleCallbackMutation = trpc.auth.googleCallback.useMutation({
		onSuccess: (data) => {
			if (typeof document !== "undefined") {
				document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
			}
			setTimeout(() => router.push("/dashboard"), 100);
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	useEffect(() => {
		setIsClient(true);
		const code = searchParams.get("code");
		const errorParam = searchParams.get("error");

		if (errorParam) {
			setError("Authentication was cancelled or failed");
			return;
		}

		if (code && !googleCallbackMutation.isPending && isClient) {
			googleCallbackMutation.mutate({ code });
		} else if (!code) {
			setError("No authorization code received");
		}
	}, [searchParams, googleCallbackMutation, isClient]);

	if (!isClient) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen space-y-4">
				<h1 className="text-2xl font-bold text-red-600">
					Authentication Error
				</h1>
				<p className="text-gray-600">{error}</p>
				<button
					onClick={() => router.push("/")}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Go Home
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center h-screen space-y-4">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			<p className="text-gray-600">Completing sign in...</p>
		</div>
	);
}
