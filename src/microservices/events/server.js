const { Kafka } = require('kafkajs');
const express = require('express');

const kafka = new Kafka({ clientId: 'events-service', brokers: [process.env.KAFKA_BROKERS] });

const TOPIC = { movie: 'movie-events', user: 'user-events', payment: 'payment-events' };


const initProducer = async () => {
  const producer = kafka.producer();

  console.log('Connecting Producer...');
  await producer.connect();
  console.log('Producer Connected Successfully.');

  async function publish(type, event) {
    await producer.send({ topic: TOPIC[type], messages: [{ value: JSON.stringify(event) }] });
  }
  return {
    publish
  }
};

const initConsumer = async () => {
  const consumer = kafka.consumer({ groupId: 'events-group' });

  console.log('Connecting Consumer...');
  await consumer.connect();
  console.log('Consumer Connected Successfully.');

  await consumer.subscribe({ topics: ['movie-events','user-events','payment-events'], fromBeginning: true });
  await consumer.run({ 
    eachMessage: async ({ topic, message }) => {
      console.log(`Обработано событие из ${topic}:`, message.value.toString());
    }
  });
};

initConsumer().catch(console.error);

initProducer().catch(console.error);

async function main() {
  const producer = await initProducer();
  await initConsumer();                       // твой consumer как есть

  const app = express();
  app.use(express.json());                    // ← тут ПАРСИМ тело (в отличие от прокси)

  app.get('/api/events/health', (req, res) => res.json({ status: true }));

  app.post('/api/events/movie', async (req, res) => {
    producer.publish('movie', req.body)

    res.status(201).json({ status: 'success', event: req.body });
  });

  app.post('/api/events/payment', async (req, res) => {
    producer.publish('payment', req.body)
    
    res.status(201).json({ status: 'success', event: req.body });
  });

  app.post('/api/events/user', async (req, res) => {
    producer.publish('user', req.body)
    
    res.status(201).json({ status: 'success', event: req.body });
  });

  app.listen(Number(process.env.PORT ?? 8082));
}
main().catch(console.error);