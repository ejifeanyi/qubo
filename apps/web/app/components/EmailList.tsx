import React, { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
	Mail,
	Star,
	Search,
	RefreshCw,
	AlertCircle,
	Loader2,
	CheckCircle2,
	Clock,
} from "lucide-react";

interface Email {
	id: string;
	subject: string;
	from: string;
	categoryId: string | null;
	createdAt: string;
	updatedAt: string;
	messageId: string;
	threadId: string | null;
	to: string;
	cc: string | null;
	category: { id: string; name: string } | null;
}

import { trpc } from "../lib/trpc";
import EmailItem from "./EmailItem";

interface EmailListProps {
	selectedCategoryId?: string;
}

// Add explicit type for the query input
interface EmailQueryInput {
	limit: number;
	categoryId?: string;
	search?: string;
	cursor?: string;
}

// Add explicit type for the query result
interface EmailQueryResult {
	emails: Email[];
	nextCursor?: string;
}

export const EmailList: React.FC<EmailListProps> = ({ selectedCategoryId }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const { ref, inView } = useInView();

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Define query input with explicit typing
	const queryInput: Omit<EmailQueryInput, "cursor"> = {
		limit: 20,
		categoryId: selectedCategoryId,
		search: debouncedSearch || undefined,
	};

	// Infinite query for emails with explicit typing
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
		refetch,
	} = trpc.gmail.getEmails.useInfiniteQuery(queryInput, {
		getNextPageParam: (lastPage: EmailQueryResult) => lastPage.nextCursor,
		refetchOnWindowFocus: false,
	});

	// Auto-fetch next page when in view
	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	// Explicit typing for emails array
	const emails: Email[] = data?.pages.flatMap((page: EmailQueryResult) => page.emails) ?? [];

	if (isLoading) {
		return <EmailListSkeleton />;
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-center">
				<AlertCircle className="h-12 w-12 text-red-500 mb-4" />
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Error loading emails
				</h3>
				<p className="text-gray-600 mb-4">{error.message}</p>
				<button
					onClick={() => refetch()}
					className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					<RefreshCw className="h-4 w-4 mr-2" />
					Try Again
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Search Bar */}
			<div className="p-4 border-b border-gray-200">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search emails..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Email List */}
			<div className="flex-1 overflow-y-auto">
				{emails.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-8 text-center">
						<Mail className="h-12 w-12 text-gray-400 mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No emails found
						</h3>
						<p className="text-gray-600">
							{debouncedSearch
								? "Try adjusting your search terms"
								: "Your emails will appear here once synced"}
						</p>
					</div>
				) : (
					<div className="divide-y divide-gray-200">
						{emails.map((email) => (
							<EmailItem key={email.id} email={email} />
						))}

						{/* Loading indicator for infinite scroll */}
						<div ref={ref} className="p-4">
							{isFetchingNextPage && (
								<div className="flex items-center justify-center">
									<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
									<span className="ml-2 text-gray-600">
										Loading more emails...
									</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
