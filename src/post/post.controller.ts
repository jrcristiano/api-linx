import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	Query,
	Request,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { Post as PostModel } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { HttpStatusCode } from 'src/shared/enums/http-status-code.enum';
import { IAuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';
import { PaginatedResult } from 'src/shared/interfaces/paginated-result.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@ApiBearerAuth()
@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
	constructor(private readonly postsService: PostService) { }

	@Post()
	@ApiOperation({ summary: 'Criar novo post' })
	@ApiResponse({
		status: HttpStatusCode.Created,
		description: 'Post criado com sucesso.',
	})
	@ApiBody({ type: CreatePostDto })
	async create(
		@Request() { user }: IAuthenticatedRequest,
		@Body() createPostDto: CreatePostDto,
	): Promise<PostModel> {
		return this.postsService.create(user.id, createPostDto);
	}

	@Get()
	@ApiOperation({ summary: 'Listar posts paginados' })
	@ApiQuery({ name: 'page', required: false, example: '1' })
	@ApiQuery({ name: 'perPage', required: false, example: '10' })
	async paginated(
		@Query('page') page = '1',
		@Query('perPage') perPage = '10',
	): Promise<PaginatedResult<PostModel>> {
		return this.postsService.paginated({
			page: parseInt(page),
			perPage: parseInt(perPage),
		});
	}

	@Get('/my')
	@ApiOperation({
		summary: 'Buscar posts paginados do usuário autênticado',
	})
	@ApiQuery({ name: 'page', required: false, example: '1' })
	@ApiQuery({ name: 'perPage', required: false, example: '10' })
	async getMyPaginatedPosts(
		@Request() { user }: IAuthenticatedRequest,
		@Query('page') page = '1',
		@Query('perPage') perPage = '10',
	): Promise<PaginatedResult<PostModel>> {
		return this.postsService.getMyPaginatedPosts(user.id, {
			page: parseInt(page),
			perPage: parseInt(perPage),
		});
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar uma post por :id' })
	@ApiParam({ name: 'id', type: Number })
	async findOne(@Param('id') id: string): Promise<PostModel> {
		return this.postsService.findOne(parseInt(id));
	}

	@Put(':id')
	@ApiOperation({ summary: 'Editar um post por :id' })
	@ApiParam({ name: 'id', type: Number })
	@ApiBody({ type: UpdatePostDto })
	async update(
		@Request() { user }: IAuthenticatedRequest,
		@Param('id') id: string,
		@Body() updatePostDto: UpdatePostDto,
	): Promise<PostModel> {
		return this.postsService.update(user.id, parseInt(id), updatePostDto);
	}

	@Delete(':id')
	@HttpCode(HttpStatusCode.NoContent)
	@ApiOperation({ summary: 'Remover post por :id' })
	@ApiParam({ name: 'id', type: Number })
	@ApiResponse({
		status: HttpStatusCode.NoContent,
		description: 'Post removido com sucesso.',
	})
	async remove(
		@Request() { user }: IAuthenticatedRequest,
		@Param('id') id: string,
	): Promise<void> {
		return this.postsService.remove(user.id, parseInt(id));
	}
}
