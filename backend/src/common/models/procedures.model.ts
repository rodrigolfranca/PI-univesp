import {
    BelongsTo,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { ProcedureStatus } from '../consts/procedure.status';
import { Category } from './categories.model';

@Table({
    tableName: 'procedures',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class Procedure extends Model {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare description: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare duration_minutes: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    declare price: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare sessions: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    declare triagem: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare triagem_minutes: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare bloqueio_periodo: number | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare category_id: number;

    @Column({
        type: DataType.ENUM(...Object.values(ProcedureStatus)),
        allowNull: false,
        defaultValue: ProcedureStatus.ACTIVE,
    })
    declare status: string;

    @BelongsTo(() => Category, 'category_id')
    declare category: Category;
}
