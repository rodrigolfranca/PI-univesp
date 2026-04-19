import {
    BelongsTo,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { Procedure } from './procedures.model';

@Table({
    tableName: 'pops',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class Pop extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    procedure_id: number;

    @Column({
        type: DataType.BLOB,
        allowNull: false,
    })
    base64: Buffer;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;

    @BelongsTo(() => Procedure, 'procedure_id')
    procedure: Procedure;
}
