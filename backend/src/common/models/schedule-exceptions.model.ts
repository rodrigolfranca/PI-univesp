import {
    BelongsTo,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { Professional } from './professionals.model';

export const ScheduleExceptionType = {
    BLOCKED: 'blocked',
    OPEN: 'open',
} as const;

@Table({
    tableName: 'schedule_exceptions',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class ScheduleException extends Model {
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
        type: DataType.DATEONLY,
        allowNull: false,
    })
    declare date: string;

    @Column({
        type: DataType.ENUM(...Object.values(ScheduleExceptionType)),
        allowNull: false,
    })
    declare type: string;

    @Column({
        type: DataType.STRING(5),
        allowNull: true,
    })
    declare start_time: string | null;

    @Column({
        type: DataType.STRING(5),
        allowNull: true,
    })
    declare end_time: string | null;

    @BelongsTo(() => Professional, 'professional_id')
    declare professional: Professional;
}
