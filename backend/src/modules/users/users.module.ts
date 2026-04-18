import { Inject, Module } from "@nestjs/common";
import { HashModule } from "src/common/hash/hash.module";
import { HashService } from "src/common/hash/hash.service";

@Module({
    imports: [HashModule],
})
export class UsersModule {
    constructor(
        @Inject()
        private readonly hashService: HashService
    ) { }

    create() {
        const password = "myPassword123";
        const hashedPassword = this.hashService.hash(password);
    }
}