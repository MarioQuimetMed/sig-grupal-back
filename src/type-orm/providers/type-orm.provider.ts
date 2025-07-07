import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "src/product/entity";
import { ClientAddress, DistCapacity, User } from "src/user/entity";

export const typeOrmProvider = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: "mongodb",
    host: configService.get<string>("db_host"),
    port: configService.get<number>("db_port"),
    username: configService.get<string>("db_username"),
    password: configService.get<string>("db_pass"),
    database: configService.get<string>("db_name"),
    authSource: "admin", // MongoDB specific option
    autoLoadEntities: true, // Add this to auto-create collections
    entities: [
      User,
      DistCapacity,
      ClientAddress,
      Product
    ],
    synchronize: configService.get<string>("node_env") === 'development', // Set to false in production
  })

})