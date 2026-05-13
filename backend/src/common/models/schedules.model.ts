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
    declare session_id: number;

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
        type: DataType.DATE,
        allowNull: false,
    })
    declare date: Date;

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
}
