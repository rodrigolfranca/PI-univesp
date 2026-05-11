import { Test, TestingModule } from '@nestjs/testing';
import { PopsService } from './pops.service';
import { PopsRepository } from './repositories/pops.repository';
import { Procedure } from '../../common/models';
import {
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';

describe('PopsService additional cases', () => {
    let service: PopsService;
    let repo: Partial<PopsRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PopsService,
                {
                    provide: PopsRepository,
                    useValue: {
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

    const mockFile = {
        buffer: Buffer.from('%PDF-1.4\n'),
        originalname: 'file.pdf',
    } as Express.Multer.File;

    it('should throw InternalServerErrorException if repository.create fails', async () => {
        jest.spyOn(Procedure, 'findByPk').mockResolvedValue({ id: 2 } as any);
        (repo.create as jest.Mock).mockRejectedValue(new Error('DB failure'));

        await expect(
            service.createPop({ procedure_id: 2, name: 'f.pdf' }, mockFile),
        ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw NotFound when getById missing', async () => {
        (repo.getById as jest.Mock).mockResolvedValue(null);
        await expect(service.getById(999)).rejects.toThrow(NotFoundException);
    });

    it('should set mime_type to application/pdf when updating with a file', async () => {
        const existing = {
            get: () => ({ id: 10 }),
            base64: mockFile.buffer,
        } as any;
        (repo.getById as jest.Mock).mockResolvedValue(existing);
        const updated = {
            get: () => ({
                id: 10,
                name: 'ok.pdf',
            }),
        } as any;
        (repo.update as jest.Mock).mockResolvedValue(updated);

        const res = await service.update(10, {}, mockFile);
        expect(repo.update).toHaveBeenCalled();
        const calledPayload = (repo.update as jest.Mock).mock.calls[0][1];
        expect(calledPayload.mime_type).toBe('application/pdf');
        expect(calledPayload.base64).toEqual(mockFile.buffer);
        expect(res).toHaveProperty('id', 10);
    });

    it('should throw InternalServerErrorException if repository.update fails', async () => {
        const existing = {
            get: () => ({ id: 11 }),
            base64: mockFile.buffer,
        } as any;
        (repo.getById as jest.Mock).mockResolvedValue(existing);
        (repo.update as jest.Mock).mockRejectedValue(
            new Error('DB update fail'),
        );

        await expect(service.update(11, { name: 'x.pdf' })).rejects.toThrow(
            InternalServerErrorException,
        );
    });

    it('should throw InternalServerErrorException if repository.remove fails on delete', async () => {
        const existing = {
            get: () => ({ id: 12 }),
            base64: mockFile.buffer,
        } as any;
        (repo.getById as jest.Mock).mockResolvedValue(existing);
        (repo.remove as jest.Mock).mockRejectedValue(
            new Error('DB remove fail'),
        );

        await expect(service.delete(12)).rejects.toThrow(
            InternalServerErrorException,
        );
    });

    it('should throw NotFound when updating non-existing pop', async () => {
        (repo.getById as jest.Mock).mockResolvedValue(null);
        await expect(service.update(999, { name: 'x.pdf' })).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw NotFound when deleting non-existing pop', async () => {
        (repo.getById as jest.Mock).mockResolvedValue(null);
        await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('should allow direct construction of PopsService', () => {
        const svc = new PopsService({} as any);
        expect(svc).toBeDefined();
    });
});
