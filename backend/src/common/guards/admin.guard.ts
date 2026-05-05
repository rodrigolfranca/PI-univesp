import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Professional } from 'src/common/models';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['x-professional-id'] || req.headers['x-user-id'];
    const professionalId = header ? Number(header) : null;
    if (!professionalId) {
      throw new ForbiddenException('Missing professional id header (x-professional-id)');
    }

    const professional = await Professional.findByPk(professionalId);
    // Debug logging to help diagnose why admins may be rejected
    console.log('[AdminGuard] professional lookup:', professionalId, professional && professional.get ? professional.get({ plain: true }) : professional);
    const isAdmin = professional && typeof professional.get === 'function' ? professional.get('is_admin') : (professional as any)?.is_admin;
    console.log('[AdminGuard] is_admin resolved type:', typeof isAdmin, 'value:', isAdmin);

    if (!professional || !isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }
    return true;
  }
}
