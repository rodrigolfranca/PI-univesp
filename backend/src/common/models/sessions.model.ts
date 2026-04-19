import {
    BelongsTo,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { Procedure } from './procedures.model';

@Table({
    tableName: 'sessions',
    timestamps: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
})
export class Session extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare procedure_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare count: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare max: number;

    @BelongsTo(() => Procedure, 'procedure_id')
    declare procedure: Procedure;
}
