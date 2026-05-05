import { PopsRepository } from './pops.repository';
import { Pop } from '../../../common/models';

describe('PopsRepository', () => {
  let repo: PopsRepository;

  beforeEach(() => {
    repo = new PopsRepository();
    jest.restoreAllMocks();
  });

  it('startTransaction calls Pop.sequelize.transaction', async () => {
    const tx = { commit: jest.fn(), rollback: jest.fn() } as any;
    (Pop as any).sequelize = { transaction: jest.fn().mockResolvedValue(tx) } as any;
    const res = await repo.startTransaction();
    expect((Pop as any).sequelize.transaction).toHaveBeenCalled();
    expect(res).toBe(tx);
  });

  it('create calls Pop.create with Buffer', async () => {
    const payload = { procedure_id: 1, base64: Buffer.from('hello').toString('base64'), name: 'a.pdf', mime_type: 'application/pdf' } as any;
    const created = { id: 1, procedure_id: 1, name: 'a.pdf', mime_type: 'application/pdf', base64: Buffer.from(payload.base64, 'base64') } as any;
    jest.spyOn(Pop, 'create').mockResolvedValue(created as any);
    const res = await repo.create(payload as any);
    expect(Pop.create).toHaveBeenCalledWith(expect.objectContaining({ base64: expect.any(Buffer), name: 'a.pdf', mime_type: 'application/pdf' }), undefined);
    expect(res).toBe(created);
  });

  it('list calls findAndCountAll with where clause', async () => {
    const rows = [{ id: 1 }];
    jest.spyOn(Pop, 'findAndCountAll').mockResolvedValue({ count: 1, rows } as any);
    const result = await repo.list({ page: 2, limit: 5, procedure_id: 10 } as any);
    expect(Pop.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: { procedure_id: 10 }, limit: 5, offset: 5, order: [['created_at', 'DESC']] }));
    expect(result.count).toBe(1);
  });

  it('getById calls findByPk', async () => {
    jest.spyOn(Pop, 'findByPk').mockResolvedValue({ id: 2 } as any);
    const res = await repo.getById(2);
    expect(Pop.findByPk).toHaveBeenCalledWith(2);
    expect(res).toHaveProperty('id', 2);
  });

  it('update modifies instance and saves', async () => {
    const instance: any = { save: jest.fn(), name: 'old', mime_type: null, base64: Buffer.from('hello'), procedure_id: 1 };
    const res = await repo.update(instance as any, { name: 'new', base64: Buffer.from('hello').toString('base64') } as any);
    expect(instance.save).toHaveBeenCalled();
    expect(instance.name).toBe('new');
    expect(instance.base64).toBeInstanceOf(Buffer);
  });

  it('update sets mime_type and procedure_id correctly', async () => {
    const instance: any = { save: jest.fn(), name: 'old', mime_type: 'x', base64: Buffer.from('hello'), procedure_id: 1 };
    await repo.update(instance as any, { mime_type: 'application/pdf', procedure_id: 42 } as any);
    expect(instance.save).toHaveBeenCalled();
    expect(instance.mime_type).toBe('application/pdf');
    expect(instance.procedure_id).toBe(42);
  });

  it('update sets mime_type to null when provided null', async () => {
    const instance: any = { save: jest.fn(), name: 'old', mime_type: 'some', base64: Buffer.from('hello'), procedure_id: 1 };
    await repo.update(instance as any, { mime_type: null } as any);
    expect(instance.save).toHaveBeenCalled();
    expect(instance.mime_type).toBeNull();
  });

  it('remove calls destroy', async () => {
    const instance: any = { destroy: jest.fn() };
    jest.spyOn(instance, 'destroy').mockResolvedValue(undefined as any);
    const res = await repo.remove(instance as any);
    expect(instance.destroy).toHaveBeenCalled();
    expect(res).toBe(instance);
  });
});
