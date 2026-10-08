import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

export const handler = async (event) => {
  console.log('Evento HTTP recibido:', event);

  // 1. Manejo explícito de peticiones Preflight (OPTIONS)
  const httpMethod = event.requestContext?.http?.method || event.httpMethod;
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: corsHeaders(),
      body: ''
    };
  }
 
  // 2. Controlar si el body viene vacío o no es un string válido
  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body ?? {});
  } catch (parseError) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'Formato JSON inválido' })
    };
  }
 
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
 
  if (!name || !email) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'Name y email son obligatorios' })
    };
  }

  try {
    const uniqueId = Date.now().toString();

    const command = new PutItemCommand({
      TableName: 'ContactMessages',
      Item: {
        id: { S: uniqueId },
        name: { S: name },
        email: { S: email },
        createdAt: { S: new Date().toISOString() }
      }
    });

    await ddb.send(command);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ 
        success: true, 
        message: '¡Solicitud recibida y guardada correctamente en DynamoDB!', 
        name 
      })
    };

  } catch (error) {
    console.error('Error al guardar en DynamoDB:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'Error interno al guardar los datos' })
    };
  }
};
 
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://fran253.github.io', // Más seguro que '*'
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
}
