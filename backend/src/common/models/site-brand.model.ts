import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'site_brand',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class SiteBrand extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    })
    declare id: number;

    @Column({ type: DataType.STRING, allowNull: false })
    declare name: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare logo_url: string | null;

    @Column({ type: DataType.STRING, allowNull: false })
    declare theme_preset: string;

    @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
    declare theme_palette: Record<string, string>;

    @Column({ type: DataType.STRING, allowNull: false })
    declare about_title: string;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    })
    declare about_paragraphs: string[];

    @Column({ type: DataType.STRING, allowNull: false, defaultValue: '' })
    declare whatsapp_number: string;

    @Column({ type: DataType.STRING, allowNull: false, defaultValue: '' })
    declare instagram_handle: string;
}
