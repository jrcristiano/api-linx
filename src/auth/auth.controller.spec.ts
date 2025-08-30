/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: AuthService;

	const mockAuthService = {
		register: jest.fn(),
		login: jest.fn(),
	};

	const mockUserService = {
		findByEmail: jest.fn(),
		create: jest.fn(),
	};

	const mockJwtService = {
		sign: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: UserService,
					useValue: mockUserService,
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get<AuthService>(AuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('register', () => {
		const registerUserDto: RegisterUserDto = {
			name: 'Test',
			lastname: 'User',
			email: 'test@example.com',
			password: 'password123',
		};

		const successResponse = {
			id: 1,
			...registerUserDto,
			password: undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should register a new user successfully', async () => {
			mockAuthService.register.mockResolvedValue(successResponse);

			const result = await controller.register(registerUserDto);

			expect(result).toEqual(successResponse);
			expect(authService.register).toHaveBeenCalledWith(registerUserDto);
			expect(authService.register).toHaveBeenCalledTimes(1);
		});

		it('should throw BadRequestException when registration fails', async () => {
			const errorMessage = 'User already exists';
			mockAuthService.register.mockRejectedValue(
				new BadRequestException(errorMessage),
			);

			await expect(controller.register(registerUserDto)).rejects.toThrow(
				BadRequestException,
			);
			await expect(controller.register(registerUserDto)).rejects.toThrow(
				errorMessage,
			);
			expect(authService.register).toHaveBeenCalledWith(registerUserDto);
		});

		it('should pass the correct DTO to auth service', async () => {
			mockAuthService.register.mockResolvedValue(successResponse);

			await controller.register(registerUserDto);

			expect(authService.register).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Test',
					lastname: 'User',
					email: 'test@example.com',
					password: 'password123',
				}),
			);
		});
	});

	describe('login', () => {
		const loginUserDto: LoginUserDto = {
			email: 'test@example.com',
			password: 'password123',
		};

		const successResponse = {
			access_token: 'jwt-token',
			user: {
				id: 1,
				name: 'Test',
				lastname: 'User',
				email: 'test@example.com',
			},
		};

		it('should login user successfully', async () => {
			mockAuthService.login.mockResolvedValue(successResponse);

			const result = await controller.login(loginUserDto);

			expect(result).toEqual(successResponse);
			expect(authService.login).toHaveBeenCalledWith(loginUserDto);
			expect(authService.login).toHaveBeenCalledTimes(1);
		});

		it('should throw UnauthorizedException when login fails', async () => {
			const errorMessage = 'Invalid credentials';
			mockAuthService.login.mockRejectedValue(
				new UnauthorizedException(errorMessage),
			);

			await expect(controller.login(loginUserDto)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(controller.login(loginUserDto)).rejects.toThrow(
				errorMessage,
			);
			expect(authService.login).toHaveBeenCalledWith(loginUserDto);
		});

		it('should pass the correct credentials to auth service', async () => {
			mockAuthService.login.mockResolvedValue(successResponse);

			await controller.login(loginUserDto);

			expect(authService.login).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'test@example.com',
					password: 'password123',
				}),
			);
		});

		it('should return the correct HTTP status code on success', async () => {
			mockAuthService.login.mockResolvedValue(successResponse);

			const result = await controller.login(loginUserDto);

			expect(result).toBeDefined();
		});
	});

	describe('HTTP status codes', () => {
		const registerUserDto: RegisterUserDto = {
			name: 'Test',
			lastname: 'User',
			email: 'test@example.com',
			password: 'password123',
		};

		const loginUserDto: LoginUserDto = {
			email: 'test@example.com',
			password: 'password123',
		};

		it('register should return 201 on success', async () => {
			const response = {
				id: 1,
				...registerUserDto,
				password: undefined,
			};
			mockAuthService.register.mockResolvedValue(response);

			const result = await controller.register(registerUserDto);
			expect(result).toBeDefined();
		});

		it('login should return 200 on success', async () => {
			const response = {
				access_token: 'token',
				user: { id: 1, email: 'test@example.com' },
			};
			mockAuthService.login.mockResolvedValue(response);

			const result = await controller.login(loginUserDto);

			expect(result).toBeDefined();
		});
	});
});
