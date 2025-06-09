"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../lib/trpc";
import Layout from "../components/Layout";

export default function Dashboard() {
	const router = useRouter();
	const [selectedCategory, setSelectedCategory] = useState<
		string | undefined
	>();

	const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
	const { data: categories } = trpc.email.getCategories.useQuery();
	const { data: emailsData, isLoading: emailsLoading } =
		trpc.email.getEmails.useQuery({
			limit: 20,
			categoryId: selectedCategory,
		});

	useEffect(() => {
		const token = localStorage.getItem("auth-token");
		if (!token) {
			router.push("/login");
		}
	}, [router]);

	if (userLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<Layout user={user}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Email Dashboard</h1>
					<p className="mt-2 text-gray-600">
						Manage and categorize your emails
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					<div className="lg:col-span-1">
						<div className="bg-white shadow rounded-lg p-6">
							<h2 className="text-lg font-medium text-gray-900 mb-4">
								Categories
							</h2>
							<div className="space-y-2">
								<button
									onClick={() => setSelectedCategory(undefined)}
									className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
										!selectedCategory
											? "bg-indigo-100 text-indigo-700"
											: "text-gray-600 hover:bg-gray-50"
									}`}
								>
									All Emails
								</button>
								{/* {categories?.map((category) => (
									<button
										key={category.id}
										onClick={() => setSelectedCategory(category.id)}
										className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
											selectedCategory === category.id
												? "bg-indigo-100 text-indigo-700"
												: "text-gray-600 hover:bg-gray-50"
										}`}
									>
										<div
											className="w-3 h-3 rounded-full mr-2"
											style={{ backgroundColor: category.color }}
										/>
										{category.name}
									</button>
								))} */}
							</div>
						</div>
					</div>

					<div className="lg:col-span-3">
						<div className="bg-white shadow rounded-lg">
							<div className="px-6 py-4 border-b border-gray-200">
								{/* <h2 className="text-lg font-medium text-gray-900">
									{selectedCategory
										? categories?.find((c) => c.id === selectedCategory)?.name
										: "All Emails"}
								</h2> */}
							</div>
							<div className="divide-y divide-gray-200">
								{emailsLoading ? (
									<div className="p-6 text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
									</div>
								) : emailsData?.emails.length === 0 ? (
									<div className="p-6 text-center text-gray-500">
										No emails found in this category.
									</div>
								) : (
									emailsData?.emails.map((email) => (
										<div key={email.id} className="p-6 hover:bg-gray-50">
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													<div className="flex items-center space-x-2 mb-1">
														<p className="text-sm font-medium text-gray-900 truncate">
															{email.from}
														</p>
														{/* {email.category && (
															<span
																className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
																style={{
																	backgroundColor: email.category.color,
																}}
															>
																{email.category.name}
															</span>
														)} */}
													</div>
													<p className="text-sm font-medium text-gray-900 mb-1">
														{email.subject}
													</p>
													<p className="text-sm text-gray-600 line-clamp-2">
														{email.snippet}
													</p>
												</div>
												{/* <div className="ml-4 flex-shrink-0">
													<p className="text-sm text-gray-500">
														{new Date(email.receivedAt).toLocaleDateString()}
													</p>
												</div> */}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
