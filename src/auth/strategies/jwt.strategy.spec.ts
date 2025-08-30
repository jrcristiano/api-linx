import { JwtStrategy } from './jwt.strategy';

const mockConfigService = {
	get: jest.fn().mockReturnValue('test-secret'),
};

describe('JwtStrategy', () => {
	let jwtStrategy: JwtStrategy;

	beforeEach(() => {
		jwtStrategy = new JwtStrategy(mockConfigService as any);
	});

	it('should be defined', () => {
		expect(jwtStrategy).toBeDefined();
	});

	describe('validate', () => {
		it('should return user object with id and email from payload', () => {
			const mockPayload = {
				sub: '123',
				email: 'test@example.com',
			};

			const result = jwtStrategy.validate(mockPayload);

			expect(result).toEqual({
				id: '123',
				email: 'test@example.com',
			});
		});

		it('should handle numeric sub value', () => {
			const mockPayload = {
				sub: 123,
				email: 'test@example.com',
			};

			const result = jwtStrategy.validate(mockPayload);

			expect(result).toEqual({
				id: 123,
				email: 'test@example.com',
			});
		});

		it('should handle different email formats', () => {
			const mockPayload = {
				sub: '123',
				email: 'user@domain.com',
			};

			const result = jwtStrategy.validate(mockPayload);

			expect(result.email).toBe('user@domain.com');
		});
	});
});

describe('JwtStrategy - Error Handling', () => {
	it('should throw error if JWT_SECRET is not configured', () => {
		const errorConfigService = {
			get: jest.fn().mockReturnValue(undefined),
		};

		expect(() => {
			new JwtStrategy(errorConfigService as any);
		}).toThrow();
	});
});
