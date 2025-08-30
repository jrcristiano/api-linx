import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePostDto {
	@ApiProperty({
		description: 'Título do post',
		example: 'Meu primeiro post',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	title: string;
}
