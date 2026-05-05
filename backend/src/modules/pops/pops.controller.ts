import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PopsService } from './pops.service';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsListDTO } from './validation/pops-list.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';

@ApiTags('POPs')
@Controller('pops')
export class PopsController {
  constructor(private readonly popsService: PopsService) {}

  @UseGuards(AdminGuard)
  @Post()
  async create(@Body() body: PopsCreateDTO) {
    return this.popsService.createPop(body);
  }

  @Get()
  async list(@Query() query: PopsListDTO) {
    return this.popsService.list(query);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.popsService.getById(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: PopsUpdateDTO) {
    return this.popsService.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.popsService.delete(id);
  }
}
