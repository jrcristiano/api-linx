import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
	@ApiProperty({
		description: 'Título do post',
		example: 'Editando meu primeiro post',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	title: string;
}
