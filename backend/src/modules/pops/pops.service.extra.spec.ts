import { Test, TestingModule } from '@nestjs/testing';
import { PopsService } from './pops.service';
import { PopsRepository } from './repositories/pops.repository';
import { Procedure } from '../../common/models';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('PopsService additional cases', () => {
  let service: PopsService;
  let repo: Partial<PopsRepository> & { startTransaction: jest.Mock };
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
    repo = module.get(PopsRepository) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should reject create when mime_type is invalid', async () => {
    jest.spyOn(Procedure, 'findByPk').mockResolvedValue({ id: 2 } as any);
    await expect(
      service.createPop({ procedure_id: 2, name: 'f.pdf', mime_type: 'text/plain', base64: 'JVBERi0xLjQK' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject create when Buffer.from throws (invalid base64)', async () => {
    jest.spyOn(Procedure, 'findByPk').mockResolvedValue({ id: 2 } as any);
    const spy = jest.spyOn(Buffer, 'from').mockImplementationOnce(() => { throw new Error('boom'); });
    await expect(
      service.createPop({ procedure_id: 2, name: 'f.pdf', base64: '!!notbase64!!' } as any),
    ).rejects.toThrow(BadRequestException);
    spy.mockRestore();
  });

  it('should rollback and throw if repository.create fails', async () => {
    jest.spyOn(Procedure, 'findByPk').mockResolvedValue({ id: 2 } as any);
    (repo.create as jest.Mock).mockRejectedValue(new Error('DB failure'));

    await expect(
      service.createPop({ procedure_id: 2, name: 'f.pdf', base64: 'JVBERi0xLjQK' } as any),
    ).rejects.toThrow(InternalServerErrorException);

    expect(repo.startTransaction).toHaveBeenCalled();
    expect(dummyTx.rollback).toHaveBeenCalled();
  });

  it('should throw NotFound when getById missing', async () => {
    (repo.getById as jest.Mock).mockResolvedValue(null);
    await expect(service.getById(999)).rejects.toThrow(NotFoundException);
  });

  it('should set mime_type to application/pdf when updating base64', async () => {
    const existing = { get: () => ({ id: 10 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    const updated = { get: () => ({ id: 10, name: 'ok.pdf', base64: Buffer.from('JVBERi0xLjQK', 'base64') }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.update as jest.Mock).mockResolvedValue(updated);

    const res = await service.update(10, { base64: 'JVBERi0xLjQK' } as any);
    expect(repo.update).toHaveBeenCalled();
    const calledDto = (repo.update as jest.Mock).mock.calls[0][1];
    expect(calledDto.mime_type).toBe('application/pdf');
    expect(res).toHaveProperty('id', 10);
  });

  it('should rollback and throw if repository.update fails', async () => {
    const existing = { get: () => ({ id: 11 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    (repo.update as jest.Mock).mockRejectedValue(new Error('DB update fail'));

    await expect(service.update(11, { name: 'x.pdf' } as any)).rejects.toThrow(InternalServerErrorException);
    expect(dummyTx.rollback).toHaveBeenCalled();
  });

  it('should rollback and throw if repository.remove fails on delete', async () => {
    const existing = { get: () => ({ id: 12 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    (repo.remove as jest.Mock).mockRejectedValue(new Error('DB remove fail'));

    await expect(service.delete(12)).rejects.toThrow(InternalServerErrorException);
    expect(dummyTx.rollback).toHaveBeenCalled();
  });

  it('should throw BadRequest when updating with invalid mime_type in dto', async () => {
    const existing = { get: () => ({ id: 13 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    await expect(service.update(13, { mime_type: 'text/plain' } as any)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequest when Buffer.from throws during update base64 validation', async () => {
    const existing = { get: () => ({ id: 14 }), base64: Buffer.from('JVBERi0xLjQK', 'base64') } as any;
    (repo.getById as jest.Mock).mockResolvedValue(existing);
    const spy = jest.spyOn(Buffer, 'from').mockImplementationOnce(() => { throw new Error('boom'); });
    await expect(service.update(14, { base64: '!!notbase64!!' } as any)).rejects.toThrow(BadRequestException);
    spy.mockRestore();
  });

  it('should throw NotFound when updating non-existing pop', async () => {
    (repo.getById as jest.Mock).mockResolvedValue(null);
    await expect(service.update(999, { name: 'x.pdf' } as any)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFound when deleting non-existing pop', async () => {
    (repo.getById as jest.Mock).mockResolvedValue(null);
    await expect(service.delete(999)).rejects.toThrow(NotFoundException);
  });

  it('should allow direct construction of PopsService', () => {
    // cover the constructor line by direct instantiation
    const svc = new PopsService({} as any);
    expect(svc).toBeDefined();
  });
});
