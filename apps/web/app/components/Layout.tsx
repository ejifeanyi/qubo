"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
	id: string;
	email: string;
	name?: string | null;
	image?: string | null;
}

interface LayoutProps {
	children: React.ReactNode;
	user: User;
}

export default function Layout({ children, user }: LayoutProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const router = useRouter();

	const handleLogout = () => {
		localStorage.removeItem("auth-token");
		router.push("/login");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">
								Email Categorization
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<div className="relative">
								<button
									onClick={() => setIsMenuOpen(!isMenuOpen)}
									className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
								>
									{user.image ? (
										<img
											className="h-8 w-8 rounded-full"
											src={user.image}
											alt={user.name || user.email}
										/>
									) : (
										<div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
											<span className="text-white text-sm font-medium">
												{(user.name || user.email)[0].toUpperCase()}
											</span>
										</div>
									)}
									<span>{user.name || user.email}</span>
								</button>
								{isMenuOpen && (
									<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
										<button
											onClick={handleLogout}
											className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											Sign out
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</nav>
			<main>{children}</main>
		</div>
	);
}
