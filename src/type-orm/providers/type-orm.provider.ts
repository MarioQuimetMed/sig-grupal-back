import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "src/product/entity";
import { DetailOrder, Order } from "src/sales/entity";
import { ClientAddress, DistCapacity, User } from "src/user/entity";

export const typeOrmProvider = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: "mongodb",
    // MongoDB connection string
    url: configService.get<string>("db_url"), 
    authSource: "admin", // MongoDB specific option
    autoLoadEntities: true, // Add this to auto-create collections
    entities: [
      User,
      DistCapacity,
      Product,
      Order,
    ],
    synchronize: configService.get<string>("node_env") === 'development', // Set to false in production
  })

})