import { Test, TestingModule } from '@nestjs/testing';
import { PopsController } from './pops.controller';
import { PopsService } from './pops.service';

describe('PopsController', () => {
  let controller: PopsController;
  const mockService = {
    createPop: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PopsController],
      providers: [{ provide: PopsService, useValue: mockService }],
    }).compile();

    controller = module.get<PopsController>(PopsController);
  });

  afterEach(() => jest.restoreAllMocks());

  it('create calls service.createPop', async () => {
    const dto = { procedure_id: 1, name: 'a.pdf', base64: 'JVBERi0xLjQK' } as any;
    mockService.createPop.mockResolvedValue({ id: 1 });
    await expect(controller.create(dto)).resolves.toEqual({ id: 1 });
    expect(mockService.createPop).toHaveBeenCalledWith(dto);
  });

  it('list calls service.list', async () => {
    const query = { page: 1, limit: 10 } as any;
    mockService.list.mockResolvedValue({ total: 0, pops: [], page: 1, limit: 10 });
    await expect(controller.list(query)).resolves.toEqual({ total: 0, pops: [], page: 1, limit: 10 });
    expect(mockService.list).toHaveBeenCalledWith(query);
  });

  it('get calls service.getById', async () => {
    mockService.getById.mockResolvedValue({ id: 3 });
    await expect(controller.get(3)).resolves.toEqual({ id: 3 });
    expect(mockService.getById).toHaveBeenCalledWith(3);
  });

  it('update calls service.update', async () => {
    const dto = { name: 'updated.pdf' } as any;
    mockService.update.mockResolvedValue({ id: 3, name: 'updated.pdf' });
    await expect(controller.update(3, dto)).resolves.toEqual({ id: 3, name: 'updated.pdf' });
    expect(mockService.update).toHaveBeenCalledWith(3, dto);
  });

  it('remove calls service.delete', async () => {
    mockService.delete.mockResolvedValue({ message: 'POP deleted' });
    await expect(controller.remove(3)).resolves.toEqual({ message: 'POP deleted' });
    expect(mockService.delete).toHaveBeenCalledWith(3);
  });
});
