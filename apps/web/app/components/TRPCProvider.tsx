"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { trpc, trpcClient } from "../lib/trpc";

interface TRPCProviderProps {
	children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
