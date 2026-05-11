import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiSchema } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestCodeDTO } from './validators/login-request-code.DTO';
import { LoginVerifyCodeDTO } from './validators/login-verify-code.DTO';
import { RecoveryRequestCodeDTO } from './validators/recovery-request-code.DTO';
import { RecoveryVerifyCodeDTO } from './validators/recovery-verify-code.DTO';

@ApiSchema({
    name: 'Auth',
    description: 'Endpoints relacionados à autenticação',
})
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('request-code')
    @ApiOperation({
        summary: "Request a login code to be sent to the user's phone number",
    })
    async requestCode(@Body() loginRequestCodeDTO: LoginRequestCodeDTO) {
        return await this.authService.requestCode(loginRequestCodeDTO);
    }

    @Post('verify-code')
    @ApiOperation({
        summary: "Verify the login code sent to the user's phone number",
    })
    async verifyCode(@Body() loginVerifyCodeDTO: LoginVerifyCodeDTO) {
        return await this.authService.verifyCode(loginVerifyCodeDTO);
    }

    @Post('recovery/request-code')
    @ApiOperation({
        summary:
            "Request a account recovery code to be sent to the user's email",
    })
    async recoveryRequestCode(
        @Body() recoveryRequestCodeDTO: RecoveryRequestCodeDTO,
    ) {
        return await this.authService.recoveryRequestCode(
            recoveryRequestCodeDTO,
        );
    }

    @Post('recovery/verify-code')
    @ApiOperation({
        summary:
            "Verify the account recovery code sent to the user's email and set new phone number",
    })
    async recoveryVerifyCode(
        @Body() recoveryVerifyCodeDTO: RecoveryVerifyCodeDTO,
    ) {
        return await this.authService.recoveryVerifyCode(recoveryVerifyCodeDTO);
    }
}
