import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class CryptoService {
    generateCode(length: number = 6): string {
        return crypto.randomInt(0, 1000000).toString().padStart(length, "0");
    }
}
