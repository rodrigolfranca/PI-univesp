import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSchema } from '@nestjs/swagger';
import type { RequestWithUser } from '../../common/types/request.type';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../../common/rate-limit/rate-limit.guard';
import { AuthGuard } from './guards';
import { AuthService } from './auth.service';
import { LoginRequestCodeDTO } from './validation/login-request-code.DTO';
import { LoginVerifyCodeDTO } from './validation/login-verify-code.DTO';
import { RecoveryRequestEmailCodeDTO } from './validation/recovery-request-email-code.DTO';
import { RecoveryVerifyEmailCodeDTO } from './validation/recovery-verify-email-code.DTO';
import { RecoveryRequestPhoneCodeDTO } from './validation/recovery-request-phone-code.DTO';
import { RecoveryVerifyPhoneCodeDTO } from './validation/recovery-verify-phone-code.DTO';
import { SignupRequestCodeDTO } from './validation/signup-request-code.DTO';
import { SignupResendCodeDTO } from './validation/signup-resend-code.DTO';
import { SignupVerifyEmailCodeDTO } from './validation/signup-verify-email-code.DTO';
import { SignupResendPhoneCodeDTO } from './validation/signup-resend-phone-code.DTO';
import { SignupVerifyPhoneCodeDTO } from './validation/signup-verify-phone-code.DTO';

@ApiSchema({
    name: 'Auth',
    description: 'Endpoints relacionados à autenticação',
})
@Controller('auth')
@RateLimit({ bucket: 'auth', key: 'identity' })
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup/request-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Request phone and email confirmation codes for signup',
    })
    async signupRequestCode(
        @Body() signupRequestCodeDTO: SignupRequestCodeDTO,
    ) {
        return await this.authService.signupRequestCode(signupRequestCodeDTO);
    }

    @Post('signup/resend-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Resend the signup email confirmation code',
    })
    async signupResendCode(@Body() signupResendCodeDTO: SignupResendCodeDTO) {
        return await this.authService.signupResendCode(signupResendCodeDTO);
    }

    @Post('signup/verify-email-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Verify the signup email code and generate the phone code',
    })
    async signupVerifyEmailCode(
        @Body() signupVerifyEmailCodeDTO: SignupVerifyEmailCodeDTO,
    ) {
        return await this.authService.signupVerifyEmailCode(
            signupVerifyEmailCodeDTO,
        );
    }

    @Post('signup/resend-phone-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Resend the signup phone confirmation code',
    })
    async signupResendPhoneCode(
        @Body() signupResendPhoneCodeDTO: SignupResendPhoneCodeDTO,
    ) {
        return await this.authService.signupResendPhoneCode(
            signupResendPhoneCodeDTO,
        );
    }

    @Post('signup/verify-phone-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Verify the signup phone code and create the client account',
    })
    async signupVerifyPhoneCode(
        @Body() signupVerifyPhoneCodeDTO: SignupVerifyPhoneCodeDTO,
    ) {
        return await this.authService.signupVerifyPhoneCode(
            signupVerifyPhoneCodeDTO,
        );
    }

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

    @Post('recovery/request-email-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Request an account recovery code to the current email',
    })
    async recoveryRequestEmailCode(@Body() dto: RecoveryRequestEmailCodeDTO) {
        return await this.authService.recoveryRequestEmailCode(dto);
    }

    @Post('recovery/verify-email-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Verify the recovery email code',
    })
    async recoveryVerifyEmailCode(@Body() dto: RecoveryVerifyEmailCodeDTO) {
        return await this.authService.recoveryVerifyEmailCode(dto);
    }

    @Post('recovery/request-phone-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Request a recovery code to the new phone number',
    })
    async recoveryRequestPhoneCode(@Body() dto: RecoveryRequestPhoneCodeDTO) {
        return await this.authService.recoveryRequestPhoneCode(dto);
    }

    @Post('recovery/verify-phone-code')
    @UseGuards(RateLimitGuard)
    @ApiOperation({
        summary: 'Verify the new phone code and update the account phone',
    })
    async recoveryVerifyPhoneCode(@Body() dto: RecoveryVerifyPhoneCodeDTO) {
        return await this.authService.recoveryVerifyPhoneCode(dto);
    }

    @Post('logout')
    @RateLimit({
        bucket: 'auth-logout',
        key: 'user',
        limit: 30,
        windowMs: 60000,
    })
    @UseGuards(AuthGuard, RateLimitGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Encerra a sessão atual' })
    async logout(@Req() request: RequestWithUser) {
        return await this.authService.logout(request.sessionJti!);
    }
}
