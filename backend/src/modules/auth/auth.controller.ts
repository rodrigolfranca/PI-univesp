import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSchema } from '@nestjs/swagger';
import { RateLimit } from 'src/common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from 'src/common/rate-limit/rate-limit.guard';
import { AuthService } from './auth.service';
import { LoginRequestCodeDTO } from './validation/login-request-code.DTO';
import { LoginVerifyCodeDTO } from './validation/login-verify-code.DTO';
import { RecoveryRequestCodeDTO } from './validation/recovery-request-code.DTO';
import { RecoveryVerifyCodeDTO } from './validation/recovery-verify-code.DTO';

@ApiSchema({
    name: 'Auth',
    description: 'Endpoints relacionados à autenticação',
})
@Controller('auth')
@RateLimit({ bucket: 'auth', key: 'identity' })
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('request-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: "Request a login code to be sent to the user's phone number",
    })
    async requestCode(@Body() loginRequestCodeDTO: LoginRequestCodeDTO) {
        return await this.authService.requestCode(loginRequestCodeDTO);
    }

    @Post('verify-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: "Verify the login code sent to the user's phone number",
    })
    async verifyCode(@Body() loginVerifyCodeDTO: LoginVerifyCodeDTO) {
        return await this.authService.verifyCode(loginVerifyCodeDTO);
    }

    @Post('recovery/request-code')
    @UseGuards(RateLimitGuard)
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
    @UseGuards(RateLimitGuard)
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
