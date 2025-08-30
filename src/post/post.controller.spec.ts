/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Post as PostModel } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostController } from './post.controller';
import { PostService } from './post.service';

describe('PostController', () => {
	let controller: PostController;
	let service: PostService;

	const mockPost: PostModel = {
		id: 1,
		title: 'Meu Post',
		userId: 1,
		deletedAt: null,
		createdAt: new Date(),
		updatedAt: null,
	};

	const mockUser = {
		id: 1,
		name: 'John',
		lastname: 'Doe',
		email: 'test@example.com',
	};

	const mockPostService = {
		create: jest.fn(),
		paginated: jest.fn(),
		getMyPaginatedPosts: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PostController],
			providers: [{ provide: PostService, useValue: mockPostService }],
		}).compile();

		controller = module.get<PostController>(PostController);
		service = module.get<PostService>(PostService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a new post', async () => {
			const dto: CreatePostDto = { title: 'Meu Post' };
			const result: PostModel = { ...mockPost, title: dto.title };

			mockPostService.create.mockResolvedValue(result);

			expect(await controller.create({ user: mockUser } as any, dto)).toEqual(
				result,
			);
			expect(service.create).toHaveBeenCalledWith(mockUser.id, dto);
		});
	});

	describe('paginated', () => {
		it('should return paginated posts', async () => {
			const result = { data: [mockPost], total: 1, page: 1, perPage: 10 };
			mockPostService.paginated.mockResolvedValue(result);

			expect(await controller.paginated('1', '10')).toEqual(result);
			expect(service.paginated).toHaveBeenCalledWith({ page: 1, perPage: 10 });
		});
	});

	describe('getMyPaginatedPosts', () => {
		it('should return user paginated posts with provided page/perPage', async () => {
			const result = { data: [mockPost], total: 1, page: 2, perPage: 5 };
			mockPostService.getMyPaginatedPosts.mockResolvedValue(result);

			expect(
				await controller.getMyPaginatedPosts(
					{ user: mockUser } as any,
					'2',
					'5',
				),
			).toEqual(result);

			expect(service.getMyPaginatedPosts).toHaveBeenCalledWith(mockUser.id, {
				page: 2,
				perPage: 5,
			});
		});

		it('should use default page and perPage when not provided', async () => {
			const result = { data: [mockPost], total: 1, page: 1, perPage: 10 };
			mockPostService.getMyPaginatedPosts.mockResolvedValue(result);

			expect(
				await controller.getMyPaginatedPosts({ user: mockUser } as any),
			).toEqual(result);
			expect(service.getMyPaginatedPosts).toHaveBeenCalledWith(mockUser.id, {
				page: 1,
				perPage: 10,
			});
		});
	});

	describe('findOne', () => {
		it('should return a single post', async () => {
			mockPostService.findOne.mockResolvedValue(mockPost);

			expect(await controller.findOne('1')).toEqual(mockPost);
			expect(service.findOne).toHaveBeenCalledWith(1);
		});
	});

	describe('update', () => {
		it('should update a post', async () => {
			const dto: UpdatePostDto = { title: 'Post Atualizado' };
			const updatedPost: PostModel = { ...mockPost, title: dto.title };

			mockPostService.update.mockResolvedValue(updatedPost);

			expect(
				await controller.update({ user: mockUser } as any, '1', dto),
			).toEqual(updatedPost);

			expect(service.update).toHaveBeenCalledWith(mockUser.id, 1, dto);
		});
	});

	describe('remove', () => {
		it('should remove a post', async () => {
			mockPostService.remove.mockResolvedValue(undefined);

			expect(
				await controller.remove({ user: mockUser } as any, '1'),
			).toBeUndefined();

			expect(service.remove).toHaveBeenCalledWith(mockUser.id, 1);
		});
	});
});
