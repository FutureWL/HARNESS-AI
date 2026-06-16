import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true)
        return
      }

      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed'), false)
    },
    credentials: true,
  })
  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT ?? 3201)
}
bootstrap()
