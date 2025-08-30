/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { PostService } from './post.service';

describe('PostService', () => {
	let service: PostService;
	let prisma: PrismaService;

	const mockUser = {
		id: 1,
		name: 'John',
		lastname: 'Doe',
		email: 'test@example.com',
		password: 'secret',
		emailVerifiedAt: new Date(),
		deletedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockPost: Post & { user: typeof mockUser } = {
		id: 1,
		title: 'Meu Post',
		userId: 1,
		deletedAt: null,
		createdAt: new Date(),
		updatedAt: null,
		user: mockUser,
	};

	const mockPrisma = {
		post: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			count: jest.fn(),
			update: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostService,
				{ provide: PrismaService, useValue: mockPrisma },
			],
		}).compile();

		service = module.get<PostService>(PostService);
		prisma = module.get<PrismaService>(PrismaService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a post', async () => {
			const dto: CreatePostDto = { title: 'Meu Post' };
			mockPrisma.post.create.mockResolvedValue(mockPost);

			const result = await service.create(mockUser.id, dto);

			expect(result).toEqual(mockPost);
			expect(prisma.post.create).toHaveBeenCalledWith({
				data: { title: dto.title, userId: mockUser.id },
			});
		});
	});

	describe('paginated', () => {
		it('should return paginated posts', async () => {
			mockPrisma.post.findMany.mockResolvedValue([mockPost]);
			mockPrisma.post.count.mockResolvedValue(1);

			const result = await service.paginated({ page: 1, perPage: 10 });

			expect(result.data).toEqual([mockPost]);
			expect(result.pagination.total).toBe(1);
			expect(prisma.post.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 0, take: 10 }),
			);
		});

		it('should throw error if page < 1', async () => {
			await expect(service.paginated({ page: 0 })).rejects.toThrow(
				'Page must be greater than 0',
			);
		});

		it('should throw error if perPage < 1', async () => {
			await expect(service.paginated({ perPage: 0 })).rejects.toThrow(
				'PerPage must be greather than 0',
			);
		});

		it('should use default values when not provided', async () => {
			mockPrisma.post.findMany.mockResolvedValue([mockPost]);
			mockPrisma.post.count.mockResolvedValue(1);

			const result = await service.paginated({});

			expect(result.data).toEqual([mockPost]);
			expect(result.pagination.page).toBe(1);
			expect(result.pagination.perPage).toBe(10);
			expect(prisma.post.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 0, take: 10 }),
			);
		});
	});

	describe('getMyPaginatedPosts', () => {
		it('should throw error if page < 1', async () => {
			await expect(
				service.getMyPaginatedPosts(mockUser.id, { page: 0 }),
			).rejects.toThrow('Page must be greater than 0');
		});

		it('should throw error if perPage < 1', async () => {
			await expect(
				service.getMyPaginatedPosts(mockUser.id, { perPage: 0 }),
			).rejects.toThrow('PerPage must be greather than 0');
		});

		it('should return user paginated posts with provided page/perPage', async () => {
			mockPrisma.post.findMany.mockResolvedValue([mockPost]);
			mockPrisma.post.count.mockResolvedValue(5);

			const result = await service.getMyPaginatedPosts(mockUser.id, {
				page: 2,
				perPage: 2,
			});

			expect(result.data).toEqual([mockPost]);
			expect(result.pagination.total).toBe(5);
			expect(result.pagination.page).toBe(2);
			expect(result.pagination.perPage).toBe(2);
			expect(prisma.post.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: mockUser.id, deletedAt: null },
					skip: 2,
					take: 2,
				}),
			);
		});

		it('should use default page and perPage when not provided', async () => {
			mockPrisma.post.findMany.mockResolvedValue([mockPost]);
			mockPrisma.post.count.mockResolvedValue(1);

			const result = await service.getMyPaginatedPosts(mockUser.id, {});

			expect(result.data).toEqual([mockPost]);
			expect(result.pagination.page).toBe(1);
			expect(result.pagination.perPage).toBe(10);
			expect(prisma.post.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 0, take: 10 }),
			);
		});
	});

	describe('findOne', () => {
		it('should return a post', async () => {
			mockPrisma.post.findUnique.mockResolvedValue(mockPost);

			const result = await service.findOne(1);
			expect(result).toEqual(mockPost);
			expect(prisma.post.findUnique).toHaveBeenCalledWith({
				where: { id: 1, deletedAt: null },
				include: {
					user: {
						select: { id: true, name: true, lastname: true, email: true },
					},
				},
			});
		});

		it('should throw NotFoundException if post not found', async () => {
			mockPrisma.post.findUnique.mockResolvedValue(null);
			await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		const dto: UpdatePostDto = { title: 'Atualizado' };

		it('should update a post', async () => {
			mockPrisma.post.findUnique.mockResolvedValue(mockPost);
			mockPrisma.post.update.mockResolvedValue({
				...mockPost,
				title: dto.title,
			});

			const result = await service.update(mockUser.id, 1, dto);

			expect(result.title).toBe(dto.title);
			expect(prisma.post.update).toHaveBeenCalledWith({
				where: { userId: mockUser.id, id: 1 },
				data: { ...dto, updatedAt: expect.any(Date) },
			});
		});

		it('should throw NotFoundException if post not found', async () => {
			mockPrisma.post.findUnique.mockResolvedValue(null);
			await expect(service.update(mockUser.id, 1, dto)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw UnauthorizedException if userId does not match', async () => {
			mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, userId: 2 });
			await expect(service.update(mockUser.id, 1, dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('remove', () => {
		it('should remove a post', async () => {
			mockPrisma.post.findUnique.mockResolvedValue(mockPost);
			mockPrisma.post.update.mockResolvedValue({
				...mockPost,
				deletedAt: new Date(),
			});

			await service.remove(mockUser.id, 1);
			expect(prisma.post.update).toHaveBeenCalledWith({
				where: { userId: mockUser.id, id: 1 },
				data: { deletedAt: expect.any(Date) },
			});
		});

		it('should throw NotFoundException if post not found', async () => {
			mockPrisma.post.findUnique.mockResolvedValue(null);
			await expect(service.remove(mockUser.id, 1)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw UnauthorizedException if userId does not match', async () => {
			mockPrisma.post.findUnique.mockResolvedValue({ ...mockPost, userId: 2 });
			await expect(service.remove(mockUser.id, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
