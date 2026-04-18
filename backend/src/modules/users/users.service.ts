import { Inject, Injectable } from "@nestjs/common";
import { HashService } from "src/common/hash/hash.service";

@Injectable()
export class UsersService {
    constructor(
        @Inject('HashService') private readonly hashService: HashService,
    ) { }
}