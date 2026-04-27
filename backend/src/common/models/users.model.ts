import { Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { Client } from './clients.model';
import { Professional } from './professionals.model';

@Table({
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class User extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(150),
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.STRING(11),
        allowNull: true,
    })
    document: string | null;

    @Column({
        type: DataType.STRING(11),
        allowNull: false,
    })
    phone_number: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    phone_number_confirmed: boolean;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        unique: true,
    })
    email: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    email_confirmed: boolean;

    @HasOne(() => Professional, {
        foreignKey: 'user_id',
        as: 'professional',
    })
    professional?: Professional;

    @HasOne(() => Client, {
        foreignKey: 'user_id',
        as: 'client',
    })
    client?: Client;
}
