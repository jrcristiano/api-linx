/* eslint-disable @typescript-eslint/unbound-method */
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { HttpExceptionFilter } from './http.exception';

describe('HttpExceptionFilter', () => {
	let filter: HttpExceptionFilter;
	let mockResponse: jest.Mocked<Response>;
	let mockArgumentsHost: ArgumentsHost;

	beforeEach(() => {
		filter = new HttpExceptionFilter();

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			send: jest.fn(),
			redirect: jest.fn(),
		} as unknown as jest.Mocked<Response>;

		const switchToHttpMock = {
			getResponse: jest.fn().mockReturnValue(mockResponse),
			getRequest: jest.fn(),
			getNext: jest.fn(),
		};

		mockArgumentsHost = {
			switchToHttp: jest.fn().mockReturnValue(switchToHttpMock),
			switchToRpc: jest.fn(),
			switchToWs: jest.fn(),
			getType: jest.fn(),
		} as unknown as ArgumentsHost;
	});

	it('should process HttpException correctly', () => {
		const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(404);
		expect(mockResponse.json).toHaveBeenCalledWith('Not Found');
	});

	it('should process generic errors as 500', () => {
		const exception = new Error('Database connection failed');

		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(500);
		expect(mockResponse.json).toHaveBeenCalledWith('Internal Server Error');
	});

	it('should process complex HttpException response objects', () => {
		const responseObject = {
			statusCode: 400,
			message: ['error1', 'error2'],
			error: 'Bad Request',
		};
		const exception = new HttpException(responseObject, HttpStatus.BAD_REQUEST);

		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith(responseObject);
	});
});
