import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class HashService {
    async hash(data: string): Promise<string> {
        return bcrypt.hash(data, 10);
    }

    async compare(data: string, hash: string): Promise<boolean> {
        return bcrypt.compare(data, hash);
    }
}
