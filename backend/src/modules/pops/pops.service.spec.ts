import { Test, TestingModule } from '@nestjs/testing';
import { PopsService } from './pops.service';
import { PopsRepository } from './repositories/pops.repository';
import { Procedure } from '../../common/models';
import { BadRequestException } from '@nestjs/common';

describe('PopsService', () => {
  let service: PopsService;
  let repo: PopsRepository;
  const dummyTx = { commit: jest.fn(), rollback: jest.fn() } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PopsService,
        {
          provide: PopsRepository,
          useValue: {
            startTransaction: jest.fn().mockResolvedValue(dummyTx),
            create: jest.fn(),
            list: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PopsService>(PopsService);
    repo = module.get<PopsRepository>(PopsRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should throw BadRequest when procedure not found', async () => {
    jest.spyOn(Procedure, 'findByPk').mockResolvedValue(null as any);
    await expect(
      service.createPop({ procedure_id: 999, name: 'file.pdf', base64: 'JVBERi0xLjQK' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequest when base64 does not represent a PDF', async () => {
    jest.spyOn(Procedure, 'findByPk').mockResolvedValue({ id: 2 } as any);
    await expect(
      service.createPop({ procedure_id: 2, name: 'file.pdf', base64: 'aGVsbG8=' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create and return pop on success', async () => {
    jest.spyOn(Procedure, 'findByPk').mockResolvedValue({ id: 2 } as any);
    const mockCreated = {
      get: () => ({ id: 123, procedure_id: 2, name: 'file.pdf', mime_type: 'application/pdf' }),
      base64: Buffer.from('JVBERi0xLjQK', 'base64'),
    } as any;
    (repo.create as jest.Mock).mockResolvedValue(mockCreated);

    const res = await service.createPop({ procedure_id: 2, name: 'file.pdf', base64: 'JVBERi0xLjQK' } as any);

    expect(repo.startTransaction).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ procedure_id: 2, name: 'file.pdf', mime_type: 'application/pdf' }),
      dummyTx,
    );
    expect(res).toHaveProperty('id', 123);
    expect(typeof res.base64).toBe('string');
  });

  it('should list pops', async () => {
    const rows = [
      { get: () => ({ id: 1, procedure_id: 2, name: 'file.pdf' }), base64: Buffer.from('JVBERi0xLjQK', 'base64') },
    ];
    (repo.list as jest.Mock).mockResolvedValue({ count: 1, rows } as any);
    const result = await service.list({ page: 1, limit: 10, procedure_id: 2 } as any);
    expect(result.total).toBe(1);
    expect(result.pops[0].base64).toBeDefined();
  });

  it('should get by id', async () => {
    const pop = { get: () => ({ id: 5, name: 'file.pdf' }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(pop);
    const res = await service.getById(5);
    expect(res.id).toBe(5);
    expect(typeof res.base64).toBe('string');
  });

  it('should update pop successfully', async () => {
    const existing = { get: () => ({ id: 8, name: 'old.pdf' }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    const updated = { get: () => ({ id: 8, name: 'new.pdf', base64: Buffer.from('JVBERi0xLjQK', 'base64') }) } as any;
    (repo.update as jest.Mock).mockResolvedValue(updated);

    const res = await service.update(8, { name: 'new.pdf' } as any);
    expect(repo.update).toHaveBeenCalledWith(existing, expect.objectContaining({ name: 'new.pdf' }));
    expect(res.name).toBe('new.pdf');
  });

  it('should throw when updating with invalid base64', async () => {
    const existing = { get: () => ({ id: 9 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    await expect(service.update(9, { base64: 'aGVsbG8=' } as any)).rejects.toThrow(BadRequestException);
  });

  it('should delete pop', async () => {
    const existing = { get: () => ({ id: 12 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    (repo.remove as jest.Mock).mockResolvedValue(existing);
    const res = await service.delete(12);
    expect(repo.remove).toHaveBeenCalledWith(existing);
    expect(res).toEqual({ message: 'POP deleted' });
  });
});
