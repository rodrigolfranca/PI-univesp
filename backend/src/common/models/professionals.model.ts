import {
    BelongsTo,
    Column,
    DataType,
    DefaultScope,
    Model,
    Scopes,
    Table,
} from 'sequelize-typescript';
import { User } from './users.model';

@DefaultScope(() => ({
    attributes: { exclude: ['google_refresh_token'] },
}))
@Scopes(() => ({
    withGoogleToken: {},
}))
@Table({
    tableName: 'professionals',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})
export class Professional extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare user_id: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    declare is_admin: boolean;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare google_refresh_token: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: 'primary',
    })
    declare google_calendar_id: string;

    @BelongsTo(() => User, 'user_id')
    declare user: User;
}
