import express from 'express'
import cors from 'cors'
import {pool} from './config/db.js'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import juryRoutes from './routes/juryRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(cookieParser)

app.get('/api/status', async (req, res) => {
    try {
        const {rows} = pool.query('SELECT NOW() AS current_time')
        res.json({ 
            status: 'succes',
            message: 'Modern Express server is running and connected to Neon!',
            databaseTime: rows[0].current_time
        })
    } catch (error) {
        console.error('Database error: ', err)
        res.status(500).json({
            status: 'error',
            message: 'Connection failed'
        })
    }
})

app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/jury-panel', juryRoutes)

const PORT = process.env.DB_PORT || 5000

app.listen(PORT, () => {
    console.log(`Server is runnig on port ${PORT}`)
})