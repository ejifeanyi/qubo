import React, { useState } from "react";
import { GmailSync } from "../components/GmailSync";
import { EmailList } from "../components/EmailList";
import { CategoryList } from "../components/CategoryList";


export const Dashboard: React.FC = () => {
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>();

	return (
		<div className="min-h-screen bg-gray-100">
			<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Sidebar */}
					<div className="lg:col-span-1 space-y-6">
						<GmailSync />
						<CategoryList
							selectedCategoryId={selectedCategoryId}
							onSelectCategory={setSelectedCategoryId}
						/>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						<div className="bg-white rounded-lg shadow h-[calc(100vh-8rem)]">
							<EmailList selectedCategoryId={selectedCategoryId} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
