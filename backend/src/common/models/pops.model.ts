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
    declare procedure_id: number;

    @Column({
        type: DataType.BLOB,
        allowNull: false,
    })
    declare base64: Buffer;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare mime_type: string | null;

    @BelongsTo(() => Procedure, 'procedure_id')
    procedure: Procedure;
}
