import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'document_templates',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class DocumentTemplates extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare title: string;

    @Column({
        type: DataType.BLOB,
        allowNull: false,
    })
    declare base64_file: Buffer;
}
