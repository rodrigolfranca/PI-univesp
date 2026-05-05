import { plainToInstance } from 'class-transformer';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';
import { PopsListDTO } from './validation/pops-list.dto';

describe('POPs DTOs', () => {
  it('should instantiate PopsListDTO and transform types', () => {
    const plain = { page: '2', limit: '5', procedure_id: '7' };
    const dto = plainToInstance(PopsListDTO, plain);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(5);
    expect(dto.procedure_id).toBe(7);
  });

  it('should instantiate create and update DTOs', () => {
    const c = new PopsCreateDTO();
    c.procedure_id = 1 as any;
    c.name = 'a.pdf';
    c.base64 = 'JVBERi0xLjQK';
    expect(c).toBeDefined();

    const u = new PopsUpdateDTO();
    u.name = 'b.pdf';
    expect(u).toBeDefined();
  });

  it('should transform create and update DTO numeric types with plainToInstance', () => {
    const create = plainToInstance(PopsCreateDTO, { procedure_id: '3', name: 'x.pdf', base64: 'JVBERi0xLjQK' });
    expect(create.procedure_id).toBe(3);

    const update = plainToInstance(PopsUpdateDTO, { procedure_id: '4' });
    expect(update.procedure_id).toBe(4);
  });
});
