/* eslint-disable prettier/prettier */
import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) { }

	async findOneByEmail(
		email: string,
		userWithPassword = false,
	): Promise<User | null> {
		return await this.prisma.user.findUnique({
			where: { email },
			select: userWithPassword
				? undefined
				: {
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
	}

	async createUserWithHashedPassword(
		data: RegisterUserDto,
	): Promise<Omit<User, 'password'>> {
		const registeredEmail = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (registeredEmail) {
			throw new ConflictException('E-mail already in use.');
		}

		const encryptedPassword = await bcrypt.hash(data.password, 10);

		const createdUser = await this.prisma.user.create({
			data: {
				...data,
				password: encryptedPassword,
			} as User,
		});

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...userWithoutPassword } = createdUser;

		return {
			...userWithoutPassword,
		};
	}
}
