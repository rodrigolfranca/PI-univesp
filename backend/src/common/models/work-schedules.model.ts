import {
    BelongsTo,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { Professional } from './professionals.model';

@Table({
    tableName: 'work_schedules',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class WorkSchedule extends Model {
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
    declare professional_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 6 },
    })
    declare day_of_week: number;

    @Column({
        type: DataType.STRING(5),
        allowNull: false,
    })
    declare start_time: string;

    @Column({
        type: DataType.STRING(5),
        allowNull: false,
    })
    declare end_time: string;

    @BelongsTo(() => Professional, 'professional_id')
    declare professional: Professional;
}
