import { Request } from 'express';

export interface IAuthenticatedRequest extends Request {
	user: {
		id: number;
		name: string;
		lastname: string;
		email: string;
		emailVerifiedAt?: string;
	};
}
