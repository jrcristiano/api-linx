/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	try {
		const encryptedPassword = await bcrypt.hash('password', 10);

		const admin = await prisma.user.upsert({
			where: { email: 'admin@linx.com' },
			update: {},
			create: {
				name: 'Admin',
				lastname: 'User',
				email: 'admin@linx.com',
				password: encryptedPassword,
			},
		});
		console.log(`Usuário criado/atualizado: ${admin.email}`);

		const user = await prisma.user.upsert({
			where: { email: 'user@linx.com' },
			update: {},
			create: {
				name: 'Cristiano',
				lastname: 'Junior',
				email: 'cristiano.junior@linx.com',
				password: encryptedPassword,
			},
		});
		console.log(`Usuário criado/atualizado: ${user.email}`);

		const adminPosts = await prisma.post.count({
			where: { userId: admin.id },
		});
		if (adminPosts === 0) {
			await prisma.post.createMany({
				data: [
					{ title: 'Postagem Admin', userId: admin.id }
				],
			});
			console.log('Posts do admin criados.');
		} else {
			console.log(`${adminPosts} posts já existem para o admin.`);
		}

		const userPosts = await prisma.post.count({
			where: { userId: user.id },
		});
		if (userPosts === 0) {
			await prisma.post.createMany({
				data: [
					{ title: 'Postagem User', userId: user.id },
				],
			});
			console.log('Posts do usuário criados.');
		} else {
			console.log(`${userPosts} posts já existem para o usuário.`);
		}

		console.log('Seed concluído com sucesso.');
	} catch (error) {
		console.error('Erro durante o seed:', error);
		throw error;
	}
}

main().catch((e) => {
	console.error('Falha na execução do seed:', e);
	process.exit(1);
});
