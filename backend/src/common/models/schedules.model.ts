import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { ScheduleStatus } from '../consts/schedule.status';

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
    session_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    professional_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    client_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    document_id: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    date: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    session: number;

    @Column({
        type: DataType.ENUM(...Object.values(ScheduleStatus)),
        allowNull: false,
    })
    status: string;
}
