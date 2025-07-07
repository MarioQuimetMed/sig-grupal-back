import { ConfigModule } from "@nestjs/config";
import { EnvConfig, EnvSchema } from "../service";

export const configProvider = ConfigModule.forRoot({
  load: [EnvConfig],
  validationSchema: EnvSchema,
  isGlobal: true
})