import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // ============ Swagger Configuration ============
  const config = new DocumentBuilder()
    .setTitle('Smart Building & Industrial IoT API')
    .setDescription(
      'Unified API for industrial machine monitoring & smart building environmental sensing',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://testt.icss.com.vn', 'Production')
    .addTag('Machines', 'Industrial machines CRUD & status control')
    .addTag('Sensor Readings', 'Machine sensor data (temperature, vibration, power, etc.)')
    .addTag('Maintenance Records', 'Maintenance history & scheduling')
    .addTag('Rooms', 'Building rooms management')
    .addTag('Environmental Readings', 'Environmental sensors (CO2, humidity, temperature, luminosity, occupancy)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🏭  Smart Building API running on http://localhost:${port}`);
  console.log(`📖  Swagger Docs available at http://localhost:${port}/docs`);
}
bootstrap();

