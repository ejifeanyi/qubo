import { trpc } from "../lib/trpc";

interface CategoryListProps {
	selectedCategoryId?: string;
	onSelectCategory: (categoryId?: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
	selectedCategoryId,
	onSelectCategory,
}) => {
	const { data: categories } = trpc.categories.getAll.useQuery();

	return (
		<div className="bg-white rounded-lg shadow p-4">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
			<div className="space-y-2">
				<button
					onClick={() => onSelectCategory(undefined)}
					className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
						!selectedCategoryId
							? "bg-blue-100 text-blue-700"
							: "text-gray-700 hover:bg-gray-100"
					}`}
				>
					All Emails
				</button>

				{categories?.map((category) => (
					<button
						key={category.id}
						onClick={() => onSelectCategory(category.id)}
						className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
							selectedCategoryId === category.id
								? "bg-blue-100 text-blue-700"
								: "text-gray-700 hover:bg-gray-100"
						}`}
					>
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: category.color }}
						/>
						<span>{category.name}</span>
					</button>
				))}
			</div>
		</div>
	);
};
