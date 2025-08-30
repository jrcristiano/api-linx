import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
interface MockUserService {
	createUserWithHashedPassword: jest.Mock;
	findOneByEmail: jest.Mock;
}
interface MockJwtService {
	sign: jest.Mock;
}

describe('AuthService', () => {
	let service: AuthService;
	let userService: MockUserService;
	let jwtService: MockJwtService;

	beforeEach(async () => {
		userService = {
			createUserWithHashedPassword: jest.fn(),
			findOneByEmail: jest.fn(),
		};

		jwtService = {
			sign: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UserService, useValue: userService },
				{ provide: JwtService, useValue: jwtService },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('register', () => {
		const registerDto = {
			email: 'test@test.com',
			password: '123456',
			name: 'Test',
			lastname: 'User',
		};

		it('should call createUserWithHashedPassword with correct dto', async () => {
			const expectedResult = { id: 1, ...registerDto };
			userService.createUserWithHashedPassword.mockResolvedValue(
				expectedResult,
			);

			const result = await service.register(registerDto as any);

			expect(userService.createUserWithHashedPassword).toHaveBeenCalledWith(
				registerDto,
			);
			expect(result).toEqual(expectedResult);
		});

		it('should handle errors from createUserWithHashedPassword', async () => {
			const error = new Error('Database error');
			userService.createUserWithHashedPassword.mockRejectedValue(error);

			await expect(service.register(registerDto as any)).rejects.toThrow(error);
			expect(userService.createUserWithHashedPassword).toHaveBeenCalledWith(
				registerDto,
			);
		});

		it('should pass through the exact response from userService', async () => {
			const mockResponse = {
				id: 1,
				email: 'test@test.com',
				name: 'Test',
				lastname: 'User',
				createdAt: new Date(),
			};
			userService.createUserWithHashedPassword.mockResolvedValue(mockResponse);

			const result = await service.register(registerDto as any);

			expect(result).toBe(mockResponse);
		});
	});

	describe('login', () => {
		const loginDto = { email: 'test@test.com', password: '123456' };
		const userMock = {
			id: 1,
			name: 'Test',
			lastname: 'User',
			email: 'test@test.com',
			password: 'hashedPassword123',
		};

		it('should throw UnauthorizedException with correct message if user not found', async () => {
			userService.findOneByEmail.mockResolvedValue(null);

			await expect(service.login(loginDto as any)).rejects.toThrow(
				new UnauthorizedException('E-mail inválido.'),
			);
			expect(userService.findOneByEmail).toHaveBeenCalledWith(
				loginDto.email,
				true,
			);
		});

		it('should throw UnauthorizedException with correct message if password is incorrect', async () => {
			userService.findOneByEmail.mockResolvedValue(userMock);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(service.login(loginDto as any)).rejects.toThrow(
				new UnauthorizedException('Senha incorreta.'),
			);
			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				userMock.password,
			);
		});

		it('should return access_token and user data without password if credentials are valid', async () => {
			userService.findOneByEmail.mockResolvedValue(userMock);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			jwtService.sign.mockReturnValue('signed-jwt-token');

			const result = await service.login(loginDto as any);

			expect(userService.findOneByEmail).toHaveBeenCalledWith(
				loginDto.email,
				true,
			);
			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				userMock.password,
			);
			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: userMock.id,
				email: userMock.email,
			});
			expect(result).toEqual({
				access_token: 'signed-jwt-token',
				user: {
					id: userMock.id,
					name: userMock.name,
					lastname: userMock.lastname,
					email: userMock.email,
				},
			});
		});

		it('should call bcrypt.compare with correct parameters', async () => {
			userService.findOneByEmail.mockResolvedValue(userMock);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			jwtService.sign.mockReturnValue('token');

			await service.login(loginDto as any);

			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				userMock.password,
			);
		});

		it('should handle bcrypt.compare errors gracefully', async () => {
			userService.findOneByEmail.mockResolvedValue(userMock);
			const bcryptError = new Error('Bcrypt error');
			(bcrypt.compare as jest.Mock).mockRejectedValue(bcryptError);

			await expect(service.login(loginDto as any)).rejects.toThrow(bcryptError);
		});

		it('should include correct payload in JWT token', async () => {
			userService.findOneByEmail.mockResolvedValue(userMock);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			jwtService.sign.mockReturnValue('token');

			await service.login(loginDto as any);

			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: userMock.id,
				email: userMock.email,
			});
		});

		it('should exclude password from returned user object', async () => {
			userService.findOneByEmail.mockResolvedValue(userMock);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			jwtService.sign.mockReturnValue('token');

			const result = await service.login(loginDto as any);

			expect(result.user).not.toHaveProperty('password');
			expect(result.user).toEqual({
				id: userMock.id,
				name: userMock.name,
				lastname: userMock.lastname,
				email: userMock.email,
			});
		});
	});

	describe('edge cases', () => {
		it('should handle empty email in login', async () => {
			userService.findOneByEmail.mockResolvedValue(null);

			await expect(
				service.login({ email: '', password: '123456' } as any),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should handle empty password in login', async () => {
			const userMock = {
				id: 1,
				email: 'test@test.com',
				password: 'hashed',
				name: 'Test',
				lastname: 'User',
			};
			userService.findOneByEmail.mockResolvedValue(userMock);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(
				service.login({ email: 'test@test.com', password: '' } as any),
			).rejects.toThrow(UnauthorizedException);
		});
	});
});
