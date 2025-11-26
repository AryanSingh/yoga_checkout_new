import express from 'express'
import crypto from 'crypto'
const router = express.Router()

function createSignature(str){
  const key = process.env.MERCHANT_KEY || 'testkey'
  return crypto.createHmac('sha256', key).update(str).digest('hex')
}

function genOrderId(){ return `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}` }

router.post('/initiate', async (req, res) => {
  const { name, email, phone, address, amount } = req.body
  if(!amount) return res.status(400).json({ error: 'amount required' })
  const orderId = genOrderId()
  const payload = {
    merchant_id: process.env.MERCHANT_ID || 'MID123',
    order_id: orderId,
    amount: String(amount),
    customer_name: name||'',
    customer_email: email||'',
    customer_phone: phone||'',
    callback_url: process.env.CALLBACK_URL || 'https://api.purnamyogashala.com/payment/callback',
    return_url_success: process.env.RETURN_URL_SUCCESS || 'https://checkout.purnamyogashala.com/payment-success',
    return_url_failure: process.env.RETURN_URL_FAILURE || 'https://checkout.purnamyogashala.com/payment-failed'
  }
  const signingString = `${payload.merchant_id}|${payload.order_id}|${payload.amount}|${payload.callback_url}`
  const signature = createSignature(signingString)
  const bankRedirectUrl = `${process.env.BANK_INITIATE_URL || 'https://bank.example.test/pay'}?merchant_id=${encodeURIComponent(payload.merchant_id)}&order_id=${encodeURIComponent(payload.order_id)}&amount=${encodeURIComponent(payload.amount)}&signature=${encodeURIComponent(signature)}`
  // You should save order in DB here (omitted)
  res.json({ paymentUrl: bankRedirectUrl, orderId })
})

router.post('/callback', (req, res) => {
  const raw = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body)
  const bankSignature = req.headers['x-bank-signature'] || req.body.signature
  const expected = crypto.createHmac('sha256', process.env.MERCHANT_KEY || 'testkey').update(raw).digest('hex')
  if(!bankSignature || expected !== bankSignature){
    console.warn('Signature mismatch', { expected, received: bankSignature })
    return res.status(400).send('INVALID_SIGNATURE')
  }
  // process callback: update DB, mark order complete
  console.log('Callback verified for order', req.body.order_id || req.body.orderId)
  res.status(200).send('OK')
})

export default router
