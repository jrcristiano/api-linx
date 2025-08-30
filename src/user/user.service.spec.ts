import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
	hash: jest.fn(),
}));

describe('UserService', () => {
	let userService: UserService;

	const mockPrismaService = {
		user: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		userService = module.get<UserService>(UserService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(userService).toBeDefined();
	});

	describe('findOneByEmail', () => {
		const mockUser = {
			id: 1,
			name: 'John',
			lastname: 'Doe',
			email: 'john@example.com',
			password: 'hashedPassword',
			emailVerifiedAt: new Date(),
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should find user by email without password', async () => {
			const expectedUserWithoutPassword = {
				id: mockUser.id,
				name: mockUser.name,
				lastname: mockUser.lastname,
				email: mockUser.email,
				emailVerifiedAt: mockUser.emailVerifiedAt,
				deletedAt: mockUser.deletedAt,
				createdAt: mockUser.createdAt,
				updatedAt: mockUser.updatedAt,
			};

			mockPrismaService.user.findUnique.mockResolvedValue(
				expectedUserWithoutPassword,
			);

			const result = await userService.findOneByEmail('john@example.com');

			expect(result).toEqual(expectedUserWithoutPassword);
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: {
					id: true,
					name: true,
					lastname: true,
					email: true,
					emailVerifiedAt: true,
					deletedAt: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});

		it('should find user by email with password when userWithPassword is true', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

			const result = await userService.findOneByEmail('john@example.com', true);

			expect(result).toEqual(mockUser);
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'john@example.com' },
				select: undefined,
			});
		});

		it('should return null when user is not found', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			const result = await userService.findOneByEmail('notfound@example.com');

			expect(result).toBeNull();
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'notfound@example.com' },
				select: {
					id: true,
					name: true,
					lastname: true,
					email: true,
					emailVerifiedAt: true,
					deletedAt: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});

	describe('createUserWithHashedPassword', () => {
		const mockRegisterUserDto: RegisterUserDto = {
			name: 'Jane',
			lastname: 'Smith',
			email: 'jane@example.com',
			password: 'plainPassword123',
		};

		const mockCreatedUser = {
			id: 1,
			name: 'Jane',
			lastname: 'Smith',
			email: 'jane@example.com',
			password: 'hashedPassword123',
			emailVerifiedAt: null,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should create user with hashed password successfully', async () => {
			const hashedPassword = 'hashedPassword123';

			mockPrismaService.user.findUnique.mockResolvedValue(null);

			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

			mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

			const result =
				await userService.createUserWithHashedPassword(mockRegisterUserDto);

			expect(result).toEqual({
				id: mockCreatedUser.id,
				name: mockCreatedUser.name,
				lastname: mockCreatedUser.lastname,
				email: mockCreatedUser.email,
				emailVerifiedAt: mockCreatedUser.emailVerifiedAt,
				deletedAt: mockCreatedUser.deletedAt,
				createdAt: mockCreatedUser.createdAt,
				updatedAt: mockCreatedUser.updatedAt,
			});

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: mockRegisterUserDto.email },
			});

			expect(bcrypt.hash).toHaveBeenCalledWith(
				mockRegisterUserDto.password,
				10,
			);

			expect(mockPrismaService.user.create).toHaveBeenCalledWith({
				data: {
					...mockRegisterUserDto,
					password: hashedPassword,
				},
			});
		});

		it('should throw ConflictException when email already exists', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockCreatedUser);

			await expect(
				userService.createUserWithHashedPassword(mockRegisterUserDto),
			).rejects.toThrow(new ConflictException('E-mail already in use.'));

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: mockRegisterUserDto.email },
			});

			expect(mockPrismaService.user.create).not.toHaveBeenCalled();
			expect(bcrypt.hash).not.toHaveBeenCalled();
		});

		it('should handle bcrypt hash error', async () => {
			const bcryptError = new Error('Bcrypt error');

			mockPrismaService.user.findUnique.mockResolvedValue(null);

			(bcrypt.hash as jest.Mock).mockRejectedValue(bcryptError);

			await expect(
				userService.createUserWithHashedPassword(mockRegisterUserDto),
			).rejects.toThrow(bcryptError);

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: mockRegisterUserDto.email },
			});

			expect(bcrypt.hash).toHaveBeenCalledWith(
				mockRegisterUserDto.password,
				10,
			);

			expect(mockPrismaService.user.create).not.toHaveBeenCalled();
		});

		it('should handle database creation error', async () => {
			const hashedPassword = 'hashedPassword123';
			const dbError = new Error('Database error');

			mockPrismaService.user.findUnique.mockResolvedValue(null);

			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

			mockPrismaService.user.create.mockRejectedValue(dbError);

			await expect(
				userService.createUserWithHashedPassword(mockRegisterUserDto),
			).rejects.toThrow(dbError);

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: mockRegisterUserDto.email },
			});

			expect(bcrypt.hash).toHaveBeenCalledWith(
				mockRegisterUserDto.password,
				10,
			);

			expect(mockPrismaService.user.create).toHaveBeenCalledWith({
				data: {
					...mockRegisterUserDto,
					password: hashedPassword,
				},
			});
		});
	});

	describe('edge cases', () => {
		it('should handle empty email in findOneByEmail', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			const result = await userService.findOneByEmail('');

			expect(result).toBeNull();
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: '' },
				select: {
					id: true,
					name: true,
					lastname: true,
					email: true,
					emailVerifiedAt: true,
					deletedAt: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});

		it('should handle special characters in email', async () => {
			const specialEmail = 'test+special@example.com';
			const mockUser = {
				id: 1,
				name: 'Test',
				lastname: 'User',
				email: specialEmail,
				emailVerifiedAt: null,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

			const result = await userService.findOneByEmail(specialEmail);

			expect(result).toEqual(mockUser);
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { email: specialEmail },
				select: {
					id: true,
					name: true,
					lastname: true,
					email: true,
					emailVerifiedAt: true,
					deletedAt: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});
});
