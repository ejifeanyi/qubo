"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "./lib/trpc-client";
import { isAuthenticated } from "./lib/auth";

export default function Home() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const { data: authUrl } = trpc.auth.getGoogleAuthUrl.useQuery();

	useEffect(() => {
		if (isAuthenticated()) {
			router.push("/dashboard");
		}
	}, [router]);

	const handleGoogleSignIn = () => {
		if (authUrl?.authUrl) {
			setIsLoading(true);
			window.location.href = authUrl.authUrl;
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen space-y-4">
			<h1 className="text-3xl text-black font-extrabold">Welcome to Qubo</h1>
			<button
				onClick={handleGoogleSignIn}
				disabled={isLoading || !authUrl}
				className="px-6 py-3 text-white bg-blue-500 rounded-lg font-bold cursor-pointer hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
			>
				{isLoading ? (
					<>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						<span>Redirecting...</span>
					</>
				) : (
					<span>Sign in with Google</span>
				)}
			</button>
		</div>
	);
}
