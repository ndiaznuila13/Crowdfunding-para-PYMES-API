import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Crowdfunding PYMES API')
    .setDescription(
      [
        'API para una plataforma fintech de crowdfunding para PYMES.',
        '',
        '**Autenticación:** inicia sesión en `POST /auth/login`, copia el `access_token` y úsalo en el botón **Authorize** como Bearer token.',
        '',
        '**Usuarios demo:** `investor@example.com`, `pyme@example.com`, `pyme2@example.com` y `admin@example.com`. Contraseña: `Password123`.',
        '',
        'Los endpoints protegidos indican el rol requerido. Actualmente, las operaciones de proyectos usan los encabezados `x-user-id` y `x-user-role` mostrados en cada endpoint; wallet, inversiones, finanzas y dashboard usan JWT.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Ambiente local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Introduce únicamente el token JWT obtenido en /auth/login',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
    customSiteTitle: 'Crowdfunding PYMES | API Docs',
  });

  app.enableCors();

  await app.listen(3000);
}
void bootstrap();
