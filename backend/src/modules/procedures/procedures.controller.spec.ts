import { Test, TestingModule } from '@nestjs/testing';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { ProceduresRepository } from './repositories/procedures.repository';
import { AdminGuard, AuthGuard } from 'src/modules/auth/guards';

describe('ProceduresController', () => {
    let controller: ProceduresController;

    const proceduresRepositoryMock = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProceduresController],
            providers: [
                ProceduresService,
                {
                    provide: ProceduresRepository,
                    useValue: proceduresRepositoryMock,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(AdminGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ProceduresController>(ProceduresController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
