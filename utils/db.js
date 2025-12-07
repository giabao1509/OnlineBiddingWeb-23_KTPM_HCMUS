import knex from 'knex';

export default knex({
  client: 'pg',
  connection: {
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.iuzrcxsoxelckstiucle',
    password: 'Bao15092005',
    database: 'postgres'
  },
  pool: { min: 0, max: 10 },
});