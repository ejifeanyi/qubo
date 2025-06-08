"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/lib/trpc-client";
import { getAuthToken, removeAuthToken, isAuthenticated } from "@/app/lib/auth";

const Dashboard = () => {
	const router = useRouter();
	const token = getAuthToken();

	const {
		data: user,
		isLoading,
		error,
	} = trpc.auth.me.useQuery({ token: token! }, { enabled: !!token });

	useEffect(() => {
		if (!isAuthenticated()) {
			router.push("/");
		}
	}, [router]);

	const handleSignOut = () => {
		removeAuthToken();
		router.push("/"); 
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (error || !user) {
		return (
			<div className="flex flex-col items-center justify-center h-screen space-y-4">
				<h1 className="text-2xl font-bold text-red-600">Error</h1>
				<p className="text-gray-600">Failed to load user data</p>
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
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
						<button
							onClick={handleSignOut}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Sign Out
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="px-4 py-5 sm:p-6">
							<div className="flex items-center space-x-4">
								{user.picture && (
									<img
										src={user.picture}
										alt={user.name || "Profile"}
										className="h-12 w-12 rounded-full"
									/>
								)}
								<div>
									<h2 className="text-xl font-semibold text-gray-900">
										Welcome, {user.name}!
									</h2>
									<p className="text-gray-500">{user.email}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default Dashboard;