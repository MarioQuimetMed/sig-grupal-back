
export interface IPaginatedEmployees<T> {
    body: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}