import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Validaciones globales con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos extra
      transform: true, // Transforma los payloads a las clases DTO
    }),
  );

  // 2. Filtro global de excepciones HTTP
  app.useGlobalFilters(new AllExceptionsFilter());

  // 3. Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Crowdfunding PYMES API')
    .setDescription('API para plataforma fintech de inversiones')
    .setVersion('1.0')
    .addBearerAuth() // Prepara Swagger para los JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 4. Habilitar CORS si habrá un frontend separado
  app.enableCors();

  await app.listen(3000);
}
bootstrap();