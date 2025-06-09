"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../lib/trpc";

declare global {
	interface Window {
		google: any;
	}
}

const Login = () => {
	const router = useRouter();
	const googleLoginMutation = trpc.auth.googleLogin.useMutation();
	const buttonRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const token = localStorage.getItem("auth-token");
		if (token) {
			router.push("/dashboard");
		}

		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		document.body.appendChild(script);

		script.onload = () => {
			window.google.accounts.id.initialize({
				client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
				callback: handleGoogleSignIn,
			});

			if (buttonRef.current) {
				window.google.accounts.id.renderButton(buttonRef.current, {
					type: "standard",
					theme: "filled_black",
					size: "large",
					text: "signin_with",
					shape: "rectangular",
					width: 300,
				});
			}
		};

		return () => {
			if (document.body.contains(script)) {
				document.body.removeChild(script);
			}
		};
	}, []);

	const handleGoogleSignIn = async (response: any) => {
		try {
			const result = await googleLoginMutation.mutateAsync({
				token: response.credential,
			});
			localStorage.setItem("auth-token", result.token);
			router.push("/dashboard");
		} catch (error) {
			console.error("Login failed:", error);
			alert("Login failed. Please try again.");
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<div className="py-5 px-4">
				<p className="text-left text-2xl font-bold text-gray-700">Qubo.</p>
			</div>

			<div className="flex-1 flex flex-col items-center justify-center">
				<div className="w-full max-w-[450px] mx-auto text-center px-4">
					<h2 className="text-4xl font-extrabold text-center text-gray-900">
						Welcome to Qubo.
					</h2>
					<p className="mt-2 text-center text-md text-gray-400">
						Organize your emails with AI-powered categorization. Sign in to get
						started.
					</p>
					<div className="mt-8 flex items-center justify-center">
						{/* This div will contain the actual Google button */}
						<div
							ref={buttonRef}
							className="w-full max-w-[300px] h-[44px]"
						></div>
					</div>

					<button className="bg-[#00C896] text-sm font-medium px-5 py-3 rounded-md text-white mr-3">
						Primary button
					</button>
				</div>
			</div>

			<div className="w-full max-w-[400px] mx-auto px-4 pb-8 text-center my-6">
				<p className="text-sm font-light text-gray-400">
					By clicking "Sign in with Google", you agree to our{" "}
					<a href="#" className="text-gray-600 underline">
						Terms of Use
					</a>{" "}
					and{" "}
					<a href="#" className="text-gray-600 underline">
						Privacy Policy
					</a>
					.
				</p>
			</div>
		</div>
	);
};

export default Login;
