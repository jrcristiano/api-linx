import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('/')
export class HealthCheckController {
	@Get()
	index(@Res() res: Response) {
		res.status(HttpStatus.OK).json({
			message: 'API OK.',
			status: HttpStatus.OK,
		});
	}
}
