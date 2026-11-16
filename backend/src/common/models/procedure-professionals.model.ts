import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { Procedure } from './procedures.model';
import { Professional } from './professionals.model';

@Table({
    tableName: 'procedure_professionals',
    timestamps: false,
})
export class ProcedureProfessional extends Model {
    @ForeignKey(() => Procedure)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
    })
    declare procedure_id: number;

    @ForeignKey(() => Professional)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
    })
    declare professional_id: number;

    @BelongsTo(() => Procedure, 'procedure_id')
    declare procedure: Procedure;

    @BelongsTo(() => Professional, 'professional_id')
    declare professional: Professional;
}
