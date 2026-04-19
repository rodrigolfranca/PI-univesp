import { Column, DataType, Model, Table } from 'sequelize-typescript';

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
    name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    description: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    duration_minutes: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    price: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    sessions: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    triagem: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    triagem_minutes: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    bloqueio_periodo: number | null;
}
