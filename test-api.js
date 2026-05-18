const http = require('http');

// 测试本地API
const testLocalApi = async () => {
  console.log('=== Testing Local API ===\n');
  
  // 测试1: 普通文生图
  console.log('1. Testing text-to-image generation...');
  await testRequest({
    prompt: 'a beautiful cat',
    width: 512,
    height: 512,
    model: 'flux-pro'
  });
  
  // 测试2: 图生图（使用小图片）
  console.log('\n2. Testing image-to-image generation...');
  const tinyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await testRequest({
    prompt: 'a cute white cat in the same style',
    width: 512,
    height: 512,
    model: 'flux-pro',
    image: tinyImage
  });
};

const testRequest = async (data) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const response = buffer.toString('utf-8');
        
        try {
          const json = JSON.parse(response);
          if (json.imageUrl) {
            console.log('Success! Image URL:', json.imageUrl.substring(0, 100), '...');
            console.log('Model:', json.model);
          } else if (json.error) {
            console.log('Error:', json.error);
          }
        } catch (e) {
          console.log('Response:', response.substring(0, 500));
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve();
    });

    req.write(JSON.stringify(data));
    req.end();
  });
};

testLocalApi();
