import { Test, TestingModule } from '@nestjs/testing'

import { AdminService } from './admin.service'
import { AppController } from './app.controller'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AdminService,
          useValue: {},
        },
      ],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('health', () => {
    it('should return service health payload', () => {
      expect(appController.getHealth()).toEqual({
        success: true,
        data: {
          service: 'harness-admin-api',
          status: 'ok',
        },
      })
    })
  })
})
