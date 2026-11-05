import { Module } from '@nestjs/common';
import { DatabaseProvider } from './provider/database.provider';

@Module({
    providers: [DatabaseProvider],
    exports: [DatabaseProvider],
})
export class DatabaseModule {}
