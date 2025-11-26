import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cors from 'cors'
import paymentRouter from './routes/payment.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

// raw body capture for signature verification
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }))
app.use(bodyParser.urlencoded({ extended: true, verify: (req, res, buf) => { req.rawBody = buf } }))

app.use(cors({ origin: ['https://checkout.purnamyogashala.com', 'https://purnamyogashala.com'] }))

app.use('/payment', paymentRouter)

app.get('/', (req, res) => res.send('Checkout API running'))

app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`))
