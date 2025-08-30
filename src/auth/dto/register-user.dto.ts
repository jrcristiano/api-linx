import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
	@ApiProperty({
		description: 'Nome do usuário',
		example: 'João',
		minLength: 3,
		maxLength: 255,
	})
	@IsString()
	@MinLength(3)
	@MaxLength(255)
	name: string;

	@ApiProperty({
		description: 'Sobrenome do usuário',
		example: 'Silva',
		minLength: 3,
		maxLength: 255,
	})
	@IsString()
	@MinLength(3)
	@MaxLength(255)
	lastname: string;

	@ApiProperty({
		description: 'Email do usuário',
		example: 'usuario@email.com',
		maxLength: 255,
	})
	@IsEmail()
	@MaxLength(255)
	email: string;

	@ApiProperty({
		description: 'Senha do usuário',
		example: 'senha1234',
		minLength: 8,
		maxLength: 255,
	})
	@IsString()
	@MinLength(8)
	@MaxLength(255)
	password: string;
}
