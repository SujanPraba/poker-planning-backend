
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Configure CORS to allow requests from any origin
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    
    app.useGlobalPipes(new ValidationPipe());
    
    await app.listen(3000);
    logger.log('Application started successfully on port 3000');
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
    throw error;
  }
}
bootstrap();
