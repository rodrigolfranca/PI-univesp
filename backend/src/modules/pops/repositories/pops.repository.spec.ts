import { Test, TestingModule } from '@nestjs/testing';
import { PopsRepository } from './pops.repository';
import { Pop } from 'src/common/models';

describe('PopsRepository', () => {
    let repo: PopsRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PopsRepository],
        }).compile();
        repo = module.get<PopsRepository>(PopsRepository);
    });

    it('create calls Pop.create with Buffer', async () => {
        const payload = {
            procedure_id: 1,
            base64: Buffer.from('hello'),
            name: 'a.pdf',
            mime_type: 'application/pdf',
        };
        const created = { id: 10, ...payload };
        jest.spyOn(Pop, 'create').mockResolvedValue(created as any);
        const res = await repo.create(payload as any);
        expect(Pop.create).toHaveBeenCalledWith(
            expect.objectContaining({
                base64: expect.any(Buffer),
                name: 'a.pdf',
            }),
            undefined,
        );
        expect(res).toEqual(created);
    });

    it('list uses Op.iLike for name and strict undefined for procedure_id', async () => {
        const spy = jest
            .spyOn(Pop, 'findAndCountAll')
            .mockResolvedValue({ count: 0, rows: [] } as any);
        await repo.list({ procedure_id: 0, name: 'test' });
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    procedure_id: 0,
                    name: expect.any(Object),
                }),
            }),
        );
    });

    it('update calls instance.update', async () => {
        const instance = { update: jest.fn().mockResolvedValue(true) } as any;
        const changes = { name: 'new.pdf' };
        await repo.update(instance, changes);
        expect(instance.update).toHaveBeenCalledWith(changes, undefined);
    });

    it('remove calls instance.destroy', async () => {
        const instance = { destroy: jest.fn().mockResolvedValue(true) } as any;
        await repo.remove(instance);
        expect(instance.destroy).toHaveBeenCalledWith(undefined);
    });
});
