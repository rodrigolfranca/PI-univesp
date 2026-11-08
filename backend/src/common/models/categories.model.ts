import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'categories',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class Category extends Model {
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
        unique: true,
    })
    declare name: string;
}
