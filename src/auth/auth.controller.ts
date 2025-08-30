import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'src/shared/enums/http-status-code.enum';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatusCode.Created)
	@ApiOperation({ summary: 'Registrar novo usuário' })
	@ApiResponse({
		status: HttpStatusCode.Created,
		description: 'Usuário registrado com sucesso',
	})
	@ApiResponse({
		status: HttpStatusCode.BadRequest,
		description: 'Dados inválidos ou usuário já existe',
	})
	@ApiBody({
		type: RegisterUserDto,
		description: 'Dados necessários para registro do usuário',
		examples: {
			admin: {
				summary: 'Exemplo de registro de administrador',
				value: {
					name: 'Admin',
					lastname: 'User',
					email: 'admin321@linx.com',
					password: 'adminpassword',
				},
			},
			cristiano: {
				summary: 'Exemplo de registro de usuário comum',
				value: {
					name: 'Cristiano',
					lastname: 'Junior',
					email: 'code321@linx.com',
					password: 'password',
				},
			},
		},
	})
	register(@Body() registerUserDto: RegisterUserDto) {
		return this.authService.register(registerUserDto);
	}

	@Post('login')
	@HttpCode(HttpStatusCode.OK)
	@ApiOperation({ summary: 'Login de usuário' })
	@ApiResponse({
		status: HttpStatusCode.OK,
		description: 'Login realizado com sucesso',
	})
	@ApiResponse({
		status: HttpStatusCode.Unauthorized,
		description: 'Credenciais inválidas',
	})
	@ApiBody({
		type: LoginUserDto,
		description: 'Credenciais de login do usuário',
		examples: {
			admin: {
				summary: 'Exemplo de login de administrador',
				value: {
					email: 'admin@linx.com',
					password: 'password',
				},
			},
			user: {
				summary: 'Exemplo de login de usuário comum',
				value: {
					email: 'code@linx.com',
					password: 'password',
				},
			},
		},
	})
	login(@Body() loginUserDto: LoginUserDto) {
		return this.authService.login(loginUserDto);
	}
}
