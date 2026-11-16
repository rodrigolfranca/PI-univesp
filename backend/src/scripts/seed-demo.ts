import { NestFactory } from '@nestjs/core';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ProcedureStatus } from '../common/consts/procedure.status';
import { ScheduleStatus } from '../common/consts/schedule.status';
import {
    Category,
    Client,
    Procedure,
    Professional,
    Schedule,
    ScheduleException,
    ScheduleExceptionType,
    User,
    WorkSchedule,
} from '../common/models';
import { SeedAdminModule } from './seed-admin.module';

interface DemoAccount {
    name: string;
    phone: string;
    email: string;
}

interface DemoProcedure {
    name: string;
    category: string;
    description: string;
    duration: number;
    price: number;
    sessions?: number;
    triagem?: boolean;
    triagem_minutes?: number;
    bloqueio_periodo?: number | null;
}

interface DemoDataset {
    admin: DemoAccount;
    professionals: DemoAccount[];
    clients: DemoAccount[];
    categories: string[];
    procedures: DemoProcedure[];
}

const DEMO_PHONES = {
    admin: '11999990001',
    professionals: ['11999990002', '11999990003', '11999990004'],
    clients: [
        '11999990005',
        '11999990006',
        '11999990007',
        '11999990008',
        '11999990009',
        '11999990010',
    ],
};

const DATASETS: Record<'dayane' | 'karina', DemoDataset> = {
    dayane: {
        admin: {
            name: 'Dayane Di Giovanni',
            phone: DEMO_PHONES.admin,
            email: 'dayane@dayanedigiovanni.com.br',
        },
        professionals: [
            {
                name: 'Ana Clara',
                phone: DEMO_PHONES.professionals[0],
                email: 'profissional1@demo.com',
            },
            {
                name: 'Beatriz Nunes',
                phone: DEMO_PHONES.professionals[1],
                email: 'profissional2@demo.com',
            },
            {
                name: 'Sofia Martins',
                phone: DEMO_PHONES.professionals[2],
                email: 'profissional3@demo.com',
            },
        ],
        clients: [
            {
                name: 'Maria Silva',
                phone: DEMO_PHONES.clients[0],
                email: 'cliente1@demo.com',
            },
            {
                name: 'Laura Santos',
                phone: DEMO_PHONES.clients[1],
                email: 'cliente2@demo.com',
            },
            {
                name: 'Carla Mendes',
                phone: DEMO_PHONES.clients[2],
                email: 'cliente3@demo.com',
            },
            {
                name: 'Beatriz Alves',
                phone: DEMO_PHONES.clients[3],
                email: 'cliente4@demo.com',
            },
            {
                name: 'Rodrigo Lima',
                phone: DEMO_PHONES.clients[4],
                email: 'cliente5@demo.com',
            },
            {
                name: 'Helena Rocha',
                phone: DEMO_PHONES.clients[5],
                email: 'cliente6@demo.com',
            },
        ],
        categories: [
            'Limpeza de Pele',
            'Facial',
            'Corporal',
            'Massagens',
            'Depilação',
        ],
        procedures: [
            {
                name: 'Limpeza de Pele Profunda',
                category: 'Limpeza de Pele',
                description:
                    'Higienização profunda com extração e máscara calmante.',
                duration: 60,
                price: 180,
                triagem: true,
                triagem_minutes: 15,
                bloqueio_periodo: 7,
            },
            {
                name: 'Peeling de Diamante',
                category: 'Facial',
                description: 'Esfoliação mecânica para renovação da pele.',
                duration: 60,
                price: 220,
                bloqueio_periodo: 15,
            },
            {
                name: 'Hidratação Facial',
                category: 'Facial',
                description: 'Hidratação intensiva com ativos calmantes.',
                duration: 45,
                price: 160,
            },
            {
                name: 'Microagulhamento',
                category: 'Facial',
                description: 'Estímulo de colágeno com microagulhas.',
                duration: 60,
                price: 350,
                sessions: 3,
                bloqueio_periodo: 30,
            },
            {
                name: 'Drenagem Linfática',
                category: 'Corporal',
                description: 'Massagem corporal para redução de retenção.',
                duration: 60,
                price: 200,
            },
            {
                name: 'Protocolo Corporal Redutor',
                category: 'Corporal',
                description: 'Protocolo corporal com massagem e ativos.',
                duration: 90,
                price: 300,
                sessions: 5,
            },
            {
                name: 'Massagem Relaxante',
                category: 'Massagens',
                description: 'Massagem corporal relaxante com óleos.',
                duration: 60,
                price: 180,
            },
            {
                name: 'Depilação a Cera',
                category: 'Depilação',
                description: 'Depilação com cera quente.',
                duration: 30,
                price: 80,
            },
        ],
    },
    karina: {
        admin: {
            name: 'Karina Alexitsch',
            phone: DEMO_PHONES.admin,
            email: 'admin@demo.com',
        },
        professionals: [
            {
                name: 'Bianca Souza',
                phone: DEMO_PHONES.professionals[0],
                email: 'profissional1@demo.com',
            },
            {
                name: 'Camila Rocha',
                phone: DEMO_PHONES.professionals[1],
                email: 'profissional2@demo.com',
            },
            {
                name: 'Renata Lima',
                phone: DEMO_PHONES.professionals[2],
                email: 'profissional3@demo.com',
            },
        ],
        clients: [
            {
                name: 'Ana Beatriz',
                phone: DEMO_PHONES.clients[0],
                email: 'cliente1@demo.com',
            },
            {
                name: 'Mariana Alves',
                phone: DEMO_PHONES.clients[1],
                email: 'cliente2@demo.com',
            },
            {
                name: 'Juliana Prado',
                phone: DEMO_PHONES.clients[2],
                email: 'cliente3@demo.com',
            },
            {
                name: 'Fernanda Costa',
                phone: DEMO_PHONES.clients[3],
                email: 'cliente4@demo.com',
            },
            {
                name: 'Larissa Gomes',
                phone: DEMO_PHONES.clients[4],
                email: 'cliente5@demo.com',
            },
            {
                name: 'Patrícia Melo',
                phone: DEMO_PHONES.clients[5],
                email: 'cliente6@demo.com',
            },
        ],
        categories: [
            'Cabelo',
            'Coloração',
            'Tratamento Capilar',
            'Cutilagem Russa',
            'Penteados',
        ],
        procedures: [
            {
                name: 'Corte Feminino',
                category: 'Cabelo',
                description: 'Corte personalizado com finalização.',
                duration: 60,
                price: 120,
            },
            {
                name: 'Escova Modelada',
                category: 'Cabelo',
                description: 'Escova com modelagem e finalização.',
                duration: 45,
                price: 80,
            },
            {
                name: 'Coloração Completa',
                category: 'Coloração',
                description: 'Coloração completa com análise de tom.',
                duration: 120,
                price: 280,
                bloqueio_periodo: 7,
            },
            {
                name: 'Mechas e Iluminado',
                category: 'Coloração',
                description: 'Mechas com iluminado personalizado.',
                duration: 180,
                price: 450,
                sessions: 2,
                bloqueio_periodo: 15,
            },
            {
                name: 'Hidratação Profunda',
                category: 'Tratamento Capilar',
                description: 'Tratamento intensivo de nutrição capilar.',
                duration: 60,
                price: 150,
            },
            {
                name: 'Reconstrução Capilar',
                category: 'Tratamento Capilar',
                description: 'Reconstrução para cabelos danificados.',
                duration: 90,
                price: 220,
                sessions: 3,
            },
            {
                name: 'Cutilagem Russa',
                category: 'Cutilagem Russa',
                description: 'Cutilagem a seco com acabamento preciso.',
                duration: 60,
                price: 90,
            },
            {
                name: 'Penteado para Festa',
                category: 'Penteados',
                description: 'Penteado personalizado para eventos.',
                duration: 90,
                price: 250,
            },
        ],
    },
};

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function toDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function daysUntilNextMonday(today: Date): number {
    return (8 - today.getUTCDay()) % 7 || 7;
}

async function ensureUser(
    account: DemoAccount,
    transaction: Transaction,
): Promise<User> {
    let user = await User.findOne({
        where: { phone_number: account.phone },
        transaction,
    });

    if (!user) {
        user = await User.findOne({
            where: { email: account.email },
            transaction,
        });
    }

    if (!user) {
        return await User.create(
            {
                name: account.name,
                phone_number: account.phone,
                email: account.email,
                phone_number_confirmed: true,
                email_confirmed: true,
            },
            { transaction },
        );
    }

    const emailOwner = await User.findOne({
        where: { email: account.email },
        transaction,
    });
    const email =
        !emailOwner || emailOwner.id === user.id ? account.email : user.email;

    await user.update(
        {
            name: account.name,
            phone_number: account.phone,
            email,
            phone_number_confirmed: true,
            email_confirmed: true,
        },
        { transaction },
    );
    return user;
}

async function ensureProfessional(
    user: User,
    isAdmin: boolean,
    transaction: Transaction,
): Promise<Professional> {
    const [professional] = await Professional.findOrCreate({
        where: { user_id: user.id },
        defaults: { user_id: user.id, is_admin: isAdmin },
        transaction,
    });
    if (professional.is_admin !== isAdmin) {
        await professional.update({ is_admin: isAdmin }, { transaction });
    }
    return professional;
}

async function ensureClient(
    user: User,
    transaction: Transaction,
): Promise<Client> {
    const [client] = await Client.findOrCreate({
        where: { user_id: user.id },
        defaults: { user_id: user.id },
        transaction,
    });
    return client;
}

async function ensureCategory(
    name: string,
    transaction: Transaction,
): Promise<Category> {
    const [category] = await Category.findOrCreate({
        where: { name },
        defaults: { name },
        transaction,
    });
    return category;
}

async function ensureProcedure(
    item: DemoProcedure,
    category: Category,
    professionals: Professional[],
    transaction: Transaction,
): Promise<Procedure> {
    let procedure = await Procedure.findOne({
        where: { name: item.name },
        transaction,
    });

    const values = {
        name: item.name,
        category_id: category.id,
        description: item.description,
        duration_minutes: item.duration,
        price: item.price,
        sessions: item.sessions ?? 1,
        triagem: item.triagem ?? false,
        triagem_minutes: item.triagem_minutes ?? 0,
        bloqueio_periodo: item.bloqueio_periodo ?? null,
        status: ProcedureStatus.ACTIVE,
    };

    if (!procedure) {
        procedure = await Procedure.create(values, { transaction });
    } else {
        await procedure.update(values, { transaction });
    }

    await procedure.$set('professionals', professionals, { transaction });
    return procedure;
}

async function ensureWorkSchedules(
    professionals: Professional[],
    transaction: Transaction,
): Promise<void> {
    const definitions = [
        { days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '17:00' },
        { days: [1, 2, 3, 4, 5], start: '10:00', end: '19:00' },
        { days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '18:00' },
    ];

    for (const [index, professional] of professionals.entries()) {
        const definition = definitions[index % definitions.length];
        for (const day of definition.days) {
            await WorkSchedule.findOrCreate({
                where: {
                    professional_id: professional.id,
                    day_of_week: day,
                    start_time: definition.start,
                    end_time: definition.end,
                },
                defaults: {
                    professional_id: professional.id,
                    day_of_week: day,
                    start_time: definition.start,
                    end_time: definition.end,
                },
                transaction,
            });
        }
    }
}

async function ensureExceptions(
    professionals: Professional[],
    today: Date,
    transaction: Transaction,
): Promise<void> {
    const nextMonday = addDays(today, daysUntilNextMonday(today));
    const nextFriday = addDays(nextMonday, 4);
    const nextSaturday = addDays(nextMonday, 5);

    await ScheduleException.findOrCreate({
        where: {
            professional_id: professionals[2].id,
            date: toDate(nextMonday),
            type: ScheduleExceptionType.BLOCKED,
            name: 'Feriado local',
        },
        defaults: {
            professional_id: professionals[2].id,
            date: toDate(nextMonday),
            type: ScheduleExceptionType.BLOCKED,
            name: 'Feriado local',
            start_time: null,
            end_time: null,
        },
        transaction,
    });

    await ScheduleException.findOrCreate({
        where: {
            professional_id: professionals[0].id,
            date: toDate(nextFriday),
            type: ScheduleExceptionType.BLOCKED,
            name: 'Compromisso pessoal',
        },
        defaults: {
            professional_id: professionals[0].id,
            date: toDate(nextFriday),
            type: ScheduleExceptionType.BLOCKED,
            name: 'Compromisso pessoal',
            start_time: '12:00',
            end_time: '14:00',
        },
        transaction,
    });

    await ScheduleException.findOrCreate({
        where: {
            professional_id: professionals[1].id,
            date: toDate(nextSaturday),
            type: ScheduleExceptionType.OPEN,
            name: 'Abertura extra',
        },
        defaults: {
            professional_id: professionals[1].id,
            date: toDate(nextSaturday),
            type: ScheduleExceptionType.OPEN,
            name: 'Abertura extra',
            start_time: '14:00',
            end_time: '17:00',
        },
        transaction,
    });
}

async function ensureAppointments(
    professionals: Professional[],
    clients: Client[],
    procedures: Procedure[],
    today: Date,
    transaction: Transaction,
): Promise<void> {
    const existing = await Schedule.count({
        where: {
            client_id: { [Op.in]: clients.map((client) => client.id) },
        },
        transaction,
    });
    if (existing > 0) return;

    const nextMonday = addDays(today, daysUntilNextMonday(today));
    const future = addDays(nextMonday, 7);
    const rows = [
        {
            procedure_id: procedures[0].id,
            professional_id: professionals[0].id,
            client_id: clients[0].id,
            date: toDate(future),
            start_time: '09:00',
            status: ScheduleStatus.SCHEDULED,
        },
        {
            procedure_id: procedures[2].id,
            professional_id: professionals[0].id,
            client_id: clients[1].id,
            date: toDate(addDays(future, 2)),
            start_time: '10:00',
            status: ScheduleStatus.SCHEDULED,
        },
        {
            procedure_id: procedures[4].id,
            professional_id: professionals[1].id,
            client_id: clients[2].id,
            date: toDate(addDays(future, 1)),
            start_time: '09:00',
            status: ScheduleStatus.SCHEDULED,
        },
        {
            procedure_id: procedures[6].id,
            professional_id: professionals[1].id,
            client_id: clients[3].id,
            date: toDate(addDays(future, 3)),
            start_time: '14:00',
            status: ScheduleStatus.SCHEDULED,
        },
        {
            procedure_id: procedures[1].id,
            professional_id: professionals[2].id,
            client_id: clients[4].id,
            date: toDate(addDays(future, 2)),
            start_time: '11:00',
            status: ScheduleStatus.SCHEDULED,
        },
        {
            procedure_id: procedures[7].id,
            professional_id: professionals[2].id,
            client_id: clients[5].id,
            date: toDate(addDays(future, 4)),
            start_time: '15:00',
            status: ScheduleStatus.SCHEDULED,
        },
        {
            procedure_id: procedures[2].id,
            professional_id: professionals[0].id,
            client_id: clients[0].id,
            date: toDate(addDays(today, -10)),
            start_time: '10:00',
            status: ScheduleStatus.COMPLETED,
        },
        {
            procedure_id: procedures[5].id,
            professional_id: professionals[1].id,
            client_id: clients[1].id,
            date: toDate(addDays(today, -12)),
            start_time: '15:00',
            status: ScheduleStatus.COMPLETED,
        },
        {
            procedure_id: procedures[3].id,
            professional_id: professionals[2].id,
            client_id: clients[2].id,
            date: toDate(addDays(today, -20)),
            start_time: '11:00',
            status: ScheduleStatus.COMPLETED,
        },
        {
            procedure_id: procedures[4].id,
            professional_id: professionals[2].id,
            client_id: clients[3].id,
            date: toDate(addDays(today, -8)),
            start_time: '09:00',
            status: ScheduleStatus.ABSENT,
        },
        {
            procedure_id: procedures[6].id,
            professional_id: professionals[0].id,
            client_id: clients[4].id,
            date: toDate(addDays(today, -5)),
            start_time: '16:00',
            status: ScheduleStatus.CANCELED,
        },
        {
            procedure_id: procedures[0].id,
            professional_id: professionals[1].id,
            client_id: clients[5].id,
            date: toDate(addDays(future, 5)),
            start_time: '16:00',
            status: ScheduleStatus.CANCELED,
        },
    ];

    await Schedule.bulkCreate(
        rows.map((row) => ({
            ...row,
            document_id: null,
            session: 1,
            google_event_id: null,
            google_event_link: null,
        })),
        { transaction },
    );
}

async function seedDemo(): Promise<void> {
    const siteId = process.env.SITE_ID?.trim().toLowerCase();
    if (siteId !== 'dayane' && siteId !== 'karina') {
        throw new Error('SITE_ID deve ser "dayane" ou "karina"');
    }
    const dataset = DATASETS[siteId];
    const app = await NestFactory.createApplicationContext(SeedAdminModule, {
        logger: ['error', 'warn'],
    });
    const sequelize = app.get<Sequelize>('DATABASE_PROVIDER');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    try {
        await sequelize.transaction(async (transaction) => {
            const adminUser = await ensureUser(dataset.admin, transaction);
            await ensureProfessional(adminUser, true, transaction);

            const professionalUsers: User[] = [];
            for (const account of dataset.professionals) {
                professionalUsers.push(await ensureUser(account, transaction));
            }
            const clientUsers: User[] = [];
            for (const account of dataset.clients) {
                clientUsers.push(await ensureUser(account, transaction));
            }

            const professionals: Professional[] = [];
            for (const user of professionalUsers) {
                professionals.push(
                    await ensureProfessional(user, false, transaction),
                );
            }

            const clients: Client[] = [];
            for (const user of clientUsers) {
                clients.push(await ensureClient(user, transaction));
            }

            const categories = new Map<string, Category>();
            for (const name of dataset.categories) {
                categories.set(name, await ensureCategory(name, transaction));
            }

            const procedures: Procedure[] = [];
            for (const item of dataset.procedures) {
                const category = categories.get(item.category);
                if (!category) {
                    throw new Error(
                        `Categoria não encontrada: ${item.category}`,
                    );
                }
                procedures.push(
                    await ensureProcedure(
                        item,
                        category,
                        professionals,
                        transaction,
                    ),
                );
            }

            await ensureWorkSchedules(professionals, transaction);
            await ensureExceptions(professionals, today, transaction);
            await ensureAppointments(
                professionals,
                clients,
                procedures,
                today,
                transaction,
            );

            console.log(
                `Dataset demo garantido para ${siteId}: 1 admin, ${professionals.length} profissionais, ${clients.length} clientes, ${categories.size} categorias, ${procedures.length} procedimentos.`,
            );
        });
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void seedDemo().catch((error: unknown) => {
    console.error(
        error instanceof Error
            ? error.message
            : 'Falha ao executar o seed demo',
    );
    process.exitCode = 1;
});
