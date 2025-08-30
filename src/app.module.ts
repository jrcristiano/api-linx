import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		PrismaModule,
		AuthModule,
		SharedModule,
		UserModule,
		PostModule,
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 30,
			},
		]),
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule { }
