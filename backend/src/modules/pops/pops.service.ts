import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PopsRepository } from './repositories/pops.repository';
import { Procedure } from 'src/common/models';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsListDTO } from './validation/pops-list.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';

@Injectable()
export class PopsService {
  constructor(private readonly popsRepository: PopsRepository) {}

  async createPop(createDto: PopsCreateDTO) {
    const procedure = await Procedure.findByPk(createDto.procedure_id);
    if (!procedure) throw new BadRequestException('Procedure not found');

    // Validate provided mime_type, if present
    if (createDto.mime_type && createDto.mime_type !== 'application/pdf') {
      throw new BadRequestException('mime_type must be application/pdf');
    }

    // Basic PDF file header validation: PDF files start with '%PDF'
    let buffer: Buffer;
    try {
      buffer = Buffer.from(createDto.base64, 'base64');
    } catch (e) {
      throw new BadRequestException('Invalid base64 payload');
    }
    if (!buffer || buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
      throw new BadRequestException('File is not a valid PDF');
    }

    const tx = await this.popsRepository.startTransaction();
    try {
      const pop = await this.popsRepository.create(
        {
          procedure_id: createDto.procedure_id,
          base64: createDto.base64,
          name: createDto.name,
          mime_type: 'application/pdf', // enforce PDF mime type
        },
        tx,
      );
      await tx.commit();
      const plain = pop.get({ plain: true }) as any;
      plain.base64 = pop.base64?.toString('base64');
      return plain;
    } catch (err) {
      await tx.rollback();
      throw new InternalServerErrorException('Error creating POP');
    }
  }

  async list(listDto: PopsListDTO) {
    const result = await this.popsRepository.list(listDto);
    const rows = result.rows.map((r) => {
      const plain: any = r.get({ plain: true });
      plain.base64 = r.base64?.toString('base64');
      return plain;
    });
    return {
      total: result.count,
      page: listDto.page,
      limit: listDto.limit,
      pops: rows,
    };
  }

  async getById(id: number) {
    const pop = await this.popsRepository.getById(id);
    if (!pop) throw new NotFoundException('POP not found');
    const plain = pop.get({ plain: true }) as any;
    plain.base64 = pop.base64?.toString('base64');
    return plain;
  }

  async update(id: number, dto: PopsUpdateDTO) {
    const pop = await this.popsRepository.getById(id);
    if (!pop) throw new NotFoundException('POP not found');

    // Validate mime type if present
    if ((dto as any).mime_type && (dto as any).mime_type !== 'application/pdf') {
      throw new BadRequestException('mime_type must be application/pdf');
    }

    // If base64 is being updated, validate it's a PDF
    if ((dto as any).base64 !== undefined && (dto as any).base64 !== null) {
      let buffer: Buffer;
      try {
        buffer = Buffer.from((dto as any).base64, 'base64');
      } catch (e) {
        throw new BadRequestException('Invalid base64 payload');
      }
      if (!buffer || buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
        throw new BadRequestException('File is not a valid PDF');
      }
      // ensure mime_type consistent
      (dto as any).mime_type = 'application/pdf';
    }

    const tx = await this.popsRepository.startTransaction();
    try {
      const updated = await this.popsRepository.update(pop, dto as any);
      await tx.commit();
      const plain = updated.get({ plain: true }) as any;
      plain.base64 = updated.base64?.toString('base64');
      return plain;
    } catch (err) {
      await tx.rollback();
      throw new InternalServerErrorException('Error updating POP');
    }
  }

  async delete(id: number) {
    const pop = await this.popsRepository.getById(id);
    if (!pop) throw new NotFoundException('POP not found');
    const tx = await this.popsRepository.startTransaction();
    try {
      await this.popsRepository.remove(pop);
      await tx.commit();
      return { message: 'POP deleted' };
    } catch (err) {
      await tx.rollback();
      throw new InternalServerErrorException('Error deleting POP');
    }
  }
}
