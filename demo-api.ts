import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: false }); // Disable logger for demo

fastify.get('/health', async () => ({ 
  status: 'ok',
  service: 'BChain Media Authenticity API',
  version: '0.1.0',
  contract: process.env.CONTRACT_ADDRESS || 'Not configured'
}));

async function runDemo() {
  try {
    await fastify.listen({ port: 3000, host: '127.0.0.1' });
    
    console.log('\n🌐 API Server Demo\n');
    console.log('✅ Server started on http://localhost:3000');
    console.log('\n📋 Available Endpoints:');
    console.log('   GET  /health              - Health check');
    console.log('   POST /assets/register     - Register asset');
    console.log('   POST /assets/verify       - Verify asset');
    console.log('   GET  /assets/:assetId     - Get asset details');
    console.log('   POST /assets/hash         - Hash uploaded file');
    
    console.log('\n🧪 Testing health endpoint...');
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));
    
    console.log('\n✅ API Demo Complete!\n');
    
    await fastify.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runDemo();
