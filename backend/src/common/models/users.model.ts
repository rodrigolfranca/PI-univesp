import { Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { UserWithType } from '../types/users.type';
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
    declare name: string;

    @Column({
        type: DataType.STRING(11),
        allowNull: true,
    })
    declare document: string | null;

    @Column({
        type: DataType.STRING(11),
        allowNull: false,
    })
    declare phone_number: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare phone_number_confirmed: boolean;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        unique: true,
    })
    declare email: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare email_confirmed: boolean;

    @HasOne(() => Professional, {
        foreignKey: 'user_id',
        as: 'professional',
    })
    declare professional?: Professional;

    @HasOne(() => Client, {
        foreignKey: 'user_id',
        as: 'client',
    })
    declare client?: Client;

    public toJSON(): UserWithType {
        const values: UserWithType = {
            id: this.id,
            name: this.name,
            phone_number: this.phone_number,
            phone_number_confirmed: this.phone_number_confirmed,
            email: this.email,
            email_confirmed: this.email_confirmed,
        } as UserWithType;
        values.professional = this.professional
            ? {
                id: this.professional.id,
                is_admin: this.professional.is_admin,
            }
            : undefined;
        values.client = this.client ? { id: this.client.id } : undefined;
        return values;
    }
}
