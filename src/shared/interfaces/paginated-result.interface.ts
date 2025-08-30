export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		perPage: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrevious: boolean;
	};
}
