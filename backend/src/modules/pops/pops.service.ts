import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Pop, Procedure } from 'src/common/models';
import { PopsRepository } from './repositories/pops.repository';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsListDTO } from './validation/pops-list.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';

export interface PopResponse {
    id: number;
    procedure_id: number;
    name: string;
    content?: Buffer;
    created_at?: Date;
    updated_at?: Date;
}

@Injectable()
export class PopsService {
    constructor(private readonly popsRepository: PopsRepository) {}

    async createPop(
        createDto: PopsCreateDTO,
        file: Express.Multer.File,
    ): Promise<PopResponse> {
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
                content: file.buffer,
                name: createDto.name,
            });
            const plain = pop.get({ plain: true }) as PopResponse;
            delete plain.content;
            return plain;
        } catch {
            throw new InternalServerErrorException('Error creating POP');
        }
    }

    async list(listDto: PopsListDTO) {
        const result = await this.popsRepository.list(listDto);
        const rows = result.rows.map((r) => {
            const plain = r.get({ plain: true }) as PopResponse;
            delete plain.content;
            return plain;
        });
        return {
            total: result.count,
            page: listDto.page,
            limit: listDto.limit,
            pops: rows,
        };
    }

    async getById(id: number): Promise<PopResponse> {
        const pop = await this.popsRepository.getById(id);
        if (!pop) throw new NotFoundException('POP not found');
        const plain = pop.get({ plain: true }) as PopResponse;
        delete plain.content;
        return plain;
    }

    async getFileBuffer(id: number): Promise<Pop> {
        const pop = await this.popsRepository.getByIdWithContent(id);
        if (!pop) throw new NotFoundException('POP not found');
        return pop;
    }

    async update(
        id: number,
        dto: PopsUpdateDTO,
        file?: Express.Multer.File,
    ): Promise<PopResponse> {
        const pop = await this.popsRepository.getById(id);
        if (!pop) throw new NotFoundException('POP not found');

        if (dto.procedure_id !== undefined) {
            const procedure = await Procedure.findByPk(dto.procedure_id);
            if (!procedure) {
                throw new BadRequestException('Procedure not found');
            }
        }

        const updatePayload: Partial<{
            name: string;
            procedure_id: number;
            content: Buffer;
        }> = { ...dto };

        if (file && file.buffer) {
            if (
                file.buffer.length < 4 ||
                file.buffer.toString('utf8', 0, 4) !== '%PDF'
            ) {
                throw new BadRequestException('File is not a valid PDF');
            }
            updatePayload.content = file.buffer;
        }

        try {
            const updated = await this.popsRepository.update(
                pop,
                updatePayload,
            );
            const plain = updated.get({ plain: true }) as PopResponse;
            delete plain.content;
            return plain;
        } catch {
            throw new InternalServerErrorException('Error updating POP');
        }
    }

    async delete(id: number): Promise<{ message: string }> {
        const pop = await this.popsRepository.getById(id);
        if (!pop) throw new NotFoundException('POP not found');
        try {
            await this.popsRepository.remove(pop);
            return { message: 'POP deleted' };
        } catch {
            throw new InternalServerErrorException('Error deleting POP');
        }
    }
}
