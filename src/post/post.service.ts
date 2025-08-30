import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PaginatedResult } from 'src/shared/interfaces/paginated-result.interface';
import { PaginationParams } from 'src/shared/interfaces/pagination-params.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';

@Injectable()
export class PostService {
	constructor(private prisma: PrismaService) {}

	async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
		return await this.prisma.post.create({
			data: {
				title: createPostDto.title,
				userId,
			},
		});
	}

	async paginated(
		params: PaginationParams = {},
	): Promise<PaginatedResult<Post>> {
		const { page = 1, perPage = 10 } = params;

		if (page < 1) {
			throw new Error('Page must be greater than 0');
		}

		if (perPage < 1) {
			throw new Error('PerPage must be greather than 0');
		}

		const skip = (page - 1) * perPage;

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					deletedAt: null,
				},
				take: perPage,
				skip,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							lastname: true,
							email: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			this.prisma.post.count({
				where: {
					deletedAt: null,
				},
			}),
		]);

		const totalPages = Math.ceil(total / perPage);

		return {
			data: posts,
			pagination: {
				page,
				perPage,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrevious: page > 1,
			},
		};
	}

	async findOne(id: number): Promise<Post> {
		const post = await this.prisma.post.findUnique({
			where: {
				id,
				deletedAt: null,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						lastname: true,
						email: true,
					},
				},
			},
		});

		if (!post) {
			throw new NotFoundException(`Post with ID ${id} not found`);
		}

		return post;
	}

	async update(
		userId: number,
		id: number,
		updatePostDto: UpdatePostDto,
	): Promise<Post> {
		const existingPost = await this.prisma.post.findUnique({
			where: { id, deletedAt: null },
		});

		if (!existingPost) {
			throw new NotFoundException(`Post with ID ${id} not found`);
		}

		if (existingPost.userId !== userId) {
			throw new UnauthorizedException(`Unauthorized action`);
		}

		const post = await this.prisma.post.update({
			where: {
				userId,
				id,
			},
			data: {
				...updatePostDto,
				updatedAt: new Date(),
			},
		});

		return post;
	}

	async remove(userId: number, id: number): Promise<void> {
		const existingPost = await this.prisma.post.findUnique({
			where: { id, deletedAt: null },
		});

		if (!existingPost) {
			throw new NotFoundException(`Post with ID ${id} not found`);
		}

		if (existingPost.userId !== userId) {
			throw new UnauthorizedException(`Unauthorized action`);
		}

		await this.prisma.post.update({
			where: {
				userId,
				id,
			},
			data: {
				deletedAt: new Date(),
			},
		});
	}

	async getMyPaginatedPosts(
		userId: number,
		params: PaginationParams = {},
	): Promise<PaginatedResult<Post>> {
		const { page = 1, perPage = 10 } = params;

		if (page < 1) {
			throw new Error('Page must be greater than 0');
		}

		if (perPage < 1) {
			throw new Error('PerPage must be greather than 0');
		}

		const skip = (page - 1) * perPage;

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId,
					deletedAt: null,
				},
				take: perPage,
				skip,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							lastname: true,
							email: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			this.prisma.post.count({
				where: {
					userId,
					deletedAt: null,
				},
			}),
		]);

		const totalPages = Math.ceil(total / perPage);

		return {
			data: posts,
			pagination: {
				page,
				perPage,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrevious: page > 1,
			},
		};
	}
}
