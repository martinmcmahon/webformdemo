const { app } = require('@azure/functions');
const { ServiceBusClient } = require('@azure/service-bus');

const connectionString = process.env.ServiceBusConnectionString;
const queueName = 'complaintsqueue';

app.http('SubmitComplaint', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request.');

        const body = await request.json();
        const { name, complaintDetails } = body;

        if (!name || !complaintDetails) {
            return { status: 400, body: 'Name and complaint details are required.' };
        }

        const message = {
            body: JSON.stringify({ name, complaintDetails, timestamp: new Date().toISOString() }),
        };

        const sbClient = new ServiceBusClient(connectionString);
        const sender = sbClient.createSender(queueName);

        try {
            await sender.sendMessages(message);
            context.log(`Sent message to ${queueName}: ${message.body}`);
            return { status: 200, body: 'Complaint submitted successfully!' };
        } catch (error) {
            context.log.error(`Error sending to Service Bus: ${error.message}`);
            return { status: 500, body: 'Failed to submit complaint.' };
        } finally {
            await sender.close();
            await sbClient.close();
        }
    },
});