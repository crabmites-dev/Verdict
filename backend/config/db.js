import pg from 'pg'
import dotenv from 'dotenv'

const {Pool} = pg 
dotenv.config() 

const pool = process.env.DATABASE_URL 
? new Pool ({
    connectionString : process.env.DATABASE_URL,
    ssl : {rejectUnauthorized: true}
}) : new Pool ({
    host : process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10) ,
    database : process.env.DB_NAME,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    })

pool.on('connect', () => {
    console.log('Connecte à la base de donnée')
})

pool.on('error', (err) => {
    console.error('Erreur lors de la connection', err)
})

//export const query = (text, params) => pool.query(text, params)

export default pool