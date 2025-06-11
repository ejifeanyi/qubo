const EmailListSkeleton: React.FC = () => {
	return (
		<div className="divide-y divide-gray-200">
			{Array.from({ length: 10 }).map((_, i) => (
				<div key={i} className="p-4 animate-pulse">
					<div className="flex items-start space-x-3">
						<div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
						<div className="flex-1">
							<div className="flex justify-between items-center mb-2">
								<div className="h-4 bg-gray-300 rounded w-32" />
								<div className="h-3 bg-gray-300 rounded w-16" />
							</div>
							<div className="h-4 bg-gray-300 rounded w-48 mb-2" />
							<div className="h-3 bg-gray-300 rounded w-full" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
