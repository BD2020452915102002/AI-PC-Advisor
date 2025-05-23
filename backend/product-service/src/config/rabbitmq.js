const amqp = require('amqplib');
const logger = require('../utils/logger');

let channel;
let connection;

/**
 * Initialize RabbitMQ connection and channel
 */
async function initRabbitMQ() {
  try {
    // Connect to RabbitMQ server
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    
    // Create channel
    channel = await connection.createChannel();
    
    // Assert exchange
    const exchange = process.env.RABBITMQ_EXCHANGE || 'ai_pc_advisor_exchange';
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    // Assert product queue
    const queueName = process.env.RABBITMQ_PRODUCT_QUEUE || 'product_queue';
    await channel.assertQueue(queueName, { durable: true });
    
    // Bind queue to exchange with routing key
    await channel.bindQueue(queueName, exchange, 'product.*');
    
    logger.info('RabbitMQ initialized successfully');
    
    // Handle connection close event
    connection.on('close', () => {
      logger.error('RabbitMQ connection closed unexpectedly');
      setTimeout(initRabbitMQ, 5000);
    });
    
    return { channel, connection };
  } catch (error) {
    logger.error(`RabbitMQ initialization error: ${error.message}`);
    setTimeout(initRabbitMQ, 5000);
    throw error;
  }
}

/**
 * Publish message to RabbitMQ
 * @param {string} routingKey - Routing key for the message
 * @param {Object} message - Message to publish
 */
async function publishMessage(routingKey, message) {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    
    const exchange = process.env.RABBITMQ_EXCHANGE || 'ai_pc_advisor_exchange';
    await channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    logger.info(`Message published to ${routingKey}`);
  } catch (error) {
    logger.error(`Error publishing message to RabbitMQ: ${error.message}`);
    throw error;
  }
}

/**
 * Consume messages from RabbitMQ
 * @param {string} queueName - Queue to consume from
 * @param {Function} callback - Callback function to process messages
 */
async function consumeMessages(queueName, callback) {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    
    await channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString());
          await callback(content, message.fields.routingKey);
          channel.ack(message);
        } catch (error) {
          logger.error(`Error processing message: ${error.message}`);
          channel.nack(message, false, false);
        }
      }
    });
    
    logger.info(`Consumer started for queue: ${queueName}`);
  } catch (error) {
    logger.error(`Error starting consumer: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initRabbitMQ,
  publishMessage,
  consumeMessages,
  getChannel: () => channel
}; 