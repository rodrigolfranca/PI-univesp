import { Test, TestingModule } from '@nestjs/testing';
import { ProceduresService } from './procedures.service';

describe('ProceduresService', () => {
  let service: ProceduresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProceduresService],
    }).compile();

    service = module.get<ProceduresService>(ProceduresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
