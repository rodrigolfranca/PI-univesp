import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'gallery_images',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class GalleryImage extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    })
    declare id: number;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare url: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare storage_path: string | null;

    @Column({ type: DataType.STRING, allowNull: true })
    declare title: string | null;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    declare sort_order: number;
}
