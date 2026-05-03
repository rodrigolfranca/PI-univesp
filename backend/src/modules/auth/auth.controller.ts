import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginRequestCodeDTO } from "./validators/login-request-code.DTO";
import { LoginVerifyCodeDTO } from "./validators/login-verify-code.DTO";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("request-code")
    async requestCode(@Body() loginRequestCodeDTO: LoginRequestCodeDTO) {
        return await this.authService.requestCode(loginRequestCodeDTO.phone_number);
    }

    @Post("verify-code")
    async verifyCode(@Body() loginVerifyCodeDTO: LoginVerifyCodeDTO) {
        return await this.authService.verifyCode(loginVerifyCodeDTO.phone_number, loginVerifyCodeDTO.verification_code);
    }

    @Post("/recovery/request-code")
    async recoveryRequestCode() {
        // Implement recovery request code logic here
    }

    @Post("/recovery/verify-code")
    async recoveryVerifyCode() {
        // Implement recovery verify code logic here
    }
}
