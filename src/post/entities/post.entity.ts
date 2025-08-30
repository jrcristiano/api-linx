import { Post as PrismaPost } from '@prisma/client';

export class Post implements PrismaPost {
	id: number;
	title: string;
	userId: number;
	createdAt: Date;
	updatedAt: Date | null;
	deletedAt: Date | null;
}
