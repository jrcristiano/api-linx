import * as dotenv from 'dotenv';
dotenv.config({
	path: '.env',
});

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/exceptions/http.exception';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.useGlobalFilters(new HttpExceptionFilter());

	const config = new DocumentBuilder()
		.setTitle('Linx API')
		.setDescription('The Linx API v1.0.0')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api-docs', app, document);

	app.enableCors({
		origin:
			process.env.APP_FRONTEND_URL || process.env.APP_FALLBACK_FRONTEND_URL,
		credentials: true,
		methods: 'GET,POST,PUT,DELETE',
		allowedHeaders: 'Content-Type, Authorization',
	});

	const port =
		Number(process.env.API_PORT) || Number(process.env.API_FALLBACK_PORT);
	await app.listen(port);
	console.log(`Server running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
	console.error('❌ Failed to start application:', err);
	process.exit(1);
});
