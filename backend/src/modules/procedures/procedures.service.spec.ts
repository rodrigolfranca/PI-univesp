import { Test, TestingModule } from '@nestjs/testing';
import { ProceduresService } from './procedures.service';
import { ProceduresRepository } from './procedures.repository';

describe('ProceduresService', () => {
    let service: ProceduresService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProceduresService,
                {
                    provide: ProceduresRepository,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<ProceduresService>(ProceduresService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
