import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { PopsRepository } from './repositories/pops.repository';
import { Procedure } from 'src/common/models';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsListDTO } from './validation/pops-list.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';

@Injectable()
export class PopsService {
    constructor(private readonly popsRepository: PopsRepository) {}

    async createPop(createDto: PopsCreateDTO, file: Express.Multer.File) {
        const procedure = await Procedure.findByPk(createDto.procedure_id);
        if (!procedure) throw new BadRequestException('Procedure not found');

        if (!file || !file.buffer) {
            throw new BadRequestException('File is required');
        }

        // Basic PDF file header validation: PDF files start with '%PDF'
        if (
            file.buffer.length < 4 ||
            file.buffer.toString('utf8', 0, 4) !== '%PDF'
        ) {
            throw new BadRequestException('File is not a valid PDF');
        }

        try {
            const pop = await this.popsRepository.create({
                procedure_id: createDto.procedure_id,
                base64: file.buffer,
                name: createDto.name,
                mime_type: 'application/pdf',
            });
            const plain = pop.get({ plain: true }) as any;
            delete plain.base64;
            return plain;
        } catch (err) {
            throw new InternalServerErrorException('Error creating POP');
        }
    }

    async list(listDto: PopsListDTO) {
        const result = await this.popsRepository.list(listDto);
        const rows = result.rows.map((r) => {
            const plain: any = r.get({ plain: true });
            delete plain.base64;
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
        delete plain.base64;
        return plain;
    }

    async getFileBuffer(id: number) {
        const pop = await this.popsRepository.getById(id);
        if (!pop) throw new NotFoundException('POP not found');
        return pop;
    }

    async update(id: number, dto: PopsUpdateDTO, file?: Express.Multer.File) {
        const pop = await this.popsRepository.getById(id);
        if (!pop) throw new NotFoundException('POP not found');

        const updatePayload: any = { ...dto };

        if (file && file.buffer) {
            if (
                file.buffer.length < 4 ||
                file.buffer.toString('utf8', 0, 4) !== '%PDF'
            ) {
                throw new BadRequestException('File is not a valid PDF');
            }
            updatePayload.base64 = file.buffer;
            updatePayload.mime_type = 'application/pdf';
        }

        try {
            const updated = await this.popsRepository.update(
                pop,
                updatePayload,
            );
            const plain = updated.get({ plain: true }) as any;
            delete plain.base64;
            return plain;
        } catch (err) {
            throw new InternalServerErrorException('Error updating POP');
        }
    }

    async delete(id: number) {
        const pop = await this.popsRepository.getById(id);
        if (!pop) throw new NotFoundException('POP not found');
        try {
            await this.popsRepository.remove(pop);
            return { message: 'POP deleted' };
        } catch (err) {
            throw new InternalServerErrorException('Error deleting POP');
        }
    }
}
