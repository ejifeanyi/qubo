import React, { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";

export const GmailSync: React.FC = () => {
	const [syncProgress, setSyncProgress] = useState<{
		progress: number;
		total: number;
	} | null>(null);

	const { data: syncStatus, refetch: refetchStatus } =
		trpc.gmail.getSyncStatus.useQuery();

	const startSyncMutation = trpc.gmail.startSync.useMutation({
		onSuccess: () => {
			refetchStatus();
		},
		onError: (error) => {
			console.error("Sync failed:", error);
		},
	});

	// Subscribe to sync progress
	const subscription = trpc.gmail.syncProgress.useSubscription(
		undefined,
		{
			enabled: syncStatus?.syncInProgress,
			onData: (data) => {
				if (data.error) {
					console.error("Sync error:", data.error);
					refetchStatus();
				} else if (data.progress !== undefined && data.total !== undefined) {
					setSyncProgress({ progress: data.progress, total: data.total });
				}
			},
			onError: (error) => {
				console.error("Subscription error:", error);
			},
		}
	);

	// Reset progress when sync completes
	useEffect(() => {
		if (!syncStatus?.syncInProgress && syncProgress) {
			setTimeout(() => setSyncProgress(null), 2000);
		}
	}, [syncStatus?.syncInProgress, syncProgress]);

	const handleStartSync = () => {
		startSyncMutation.mutate();
	};

	const handleReconnectGmail = () => {
		// Redirect to OAuth flow
		window.location.href = "/api/auth/google";
	};

	if (!syncStatus?.isConnected) {
		return (
			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center space-x-3 mb-4">
					<div className="flex-shrink-0">
						<AlertCircle className="h-8 w-8 text-yellow-500" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-gray-900">
							Connect Gmail
						</h3>
						<p className="text-gray-600">
							Connect your Gmail account to start syncing emails
						</p>
					</div>
				</div>
				<button
					onClick={handleReconnectGmail}
					className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					<Mail className="h-4 w-4 mr-2" />
					Connect Gmail
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Gmail Sync</h3>
					<div className="flex items-center space-x-4 text-sm text-gray-600">
						<span>{syncStatus.emailCount.toLocaleString()} emails synced</span>
						{syncStatus.lastSyncAt && (
							<span>
								Last sync: {new Date(syncStatus.lastSyncAt).toLocaleString()}
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center space-x-2">
					{syncStatus.syncInProgress ? (
						<div className="flex items-center text-blue-600">
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
							Syncing...
						</div>
					) : (
						<CheckCircle2 className="h-5 w-5 text-green-500" />
					)}
				</div>
			</div>

			{/* Progress Bar */}
			{syncStatus.syncInProgress && syncProgress && (
				<div className="mb-4">
					<div className="flex justify-between text-sm text-gray-600 mb-2">
						<span>Syncing emails...</span>
						<span>
							{syncProgress.progress} / {syncProgress.total}
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{
								width: `${(syncProgress.progress / syncProgress.total) * 100}%`,
							}}
						/>
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex space-x-3">
				<button
					onClick={handleStartSync}
					disabled={syncStatus.syncInProgress || startSyncMutation.isLoading}
					className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{syncStatus.syncInProgress ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
							Syncing...
						</>
					) : (
						<>
							<RefreshCw className="h-4 w-4 mr-2" />
							Sync Now
						</>
					)}
				</button>

				<button
					onClick={handleReconnectGmail}
					className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
				>
					Reconnect
				</button>
			</div>
		</div>
	);
};
