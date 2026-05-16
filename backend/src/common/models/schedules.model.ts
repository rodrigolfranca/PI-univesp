import {
    BelongsTo,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { ScheduleStatus } from '../consts/schedule.status';
import { Procedure } from './procedures.model';

@Table({
    tableName: 'schedules',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class Schedule extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
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
    declare professional_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare client_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare document_id: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
    })
    declare date: string;

    @Column({
        type: DataType.STRING(5),
        allowNull: false,
    })
    declare start_time: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare session: number;

    @Column({
        type: DataType.ENUM(...Object.values(ScheduleStatus)),
        allowNull: false,
    })
    declare status: string;

    @BelongsTo(() => Procedure, 'procedure_id')
    declare procedure: Procedure;
}
