"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed'), false);
        },
        credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 37203);
}
bootstrap();
//# sourceMappingURL=main.js.map