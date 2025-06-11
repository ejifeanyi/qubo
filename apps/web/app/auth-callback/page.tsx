import { useEffect } from "react";
import { useRouter } from "next/router";
import { trpc } from "../lib/trpc";
import { Loader2 } from "lucide-react";


export default function AuthCallback() {
	const router = useRouter();
	const { code, error } = router.query;

	const handleCallbackMutation = trpc.auth.handleGoogleCallback.useMutation({
		onSuccess: (data) => {
			// Store JWT token
			localStorage.setItem("token", data.token);
			// Redirect to dashboard
			router.push("/dashboard");
		},
		onError: (error) => {
			console.error("Auth callback failed:", error);
			router.push("/login?error=auth_failed");
		},
	});

	useEffect(() => {
		if (code && typeof code === "string") {
			handleCallbackMutation.mutate({ code });
		} else if (error) {
			router.push("/login?error=auth_cancelled");
		}
	}, [code, error, handleCallbackMutation, router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="text-center">
				<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
				<h2 className="text-lg font-semibold text-gray-900">
					Completing authentication...
				</h2>
				<p className="text-gray-600">
					Please wait while we set up your account.
				</p>
			</div>
		</div>
	);
}
