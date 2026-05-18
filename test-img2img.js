const fs = require('fs');
const path = require('path');
const https = require('https');

const testImagePath = path.join(__dirname, 'test-reference.jpg');

// 生成一个简单的测试用data URL（小图片）
const createTestDataUrl = () => {
  // 一个非常小的红色像素图片的base64编码
  const tinyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${tinyImageBase64}`;
};

const testImg2imgUrl = async () => {
  const dataUrl = createTestDataUrl();
  console.log('Test data URL length:', dataUrl.length);
  
  const prompt = 'a beautiful landscape with mountains';
  const encodedPrompt = encodeURIComponent(prompt);
  const encodedImage = encodeURIComponent(dataUrl);
  
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=12345&model=flux&image=${encodedImage}`;
  
  console.log('\nGenerated img2img URL:');
  console.log('URL length:', url.length);
  console.log('First 500 chars:', url.substring(0, 500));
  
  // 测试请求
  console.log('\nTesting URL...');
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        console.log('\nResponse length:', buffer.length);
        
        if (res.statusCode === 200) {
          fs.writeFileSync(path.join(__dirname, 'test-output.jpg'), buffer);
          console.log('Image saved successfully!');
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          const responseStr = buffer.toString('utf-8');
          console.log('Error response:', responseStr.substring(0, 500));
          resolve({ success: false, statusCode: res.statusCode, error: responseStr });
        }
      });
    }).on('error', (e) => {
      console.error('Request error:', e.message);
      resolve({ success: false, error: e.message });
    });
  });
};

// 测试普通生成（无参考图）
const testNormalGeneration = async () => {
  const prompt = 'a beautiful cat';
  const encodedPrompt = encodeURIComponent(prompt);
  
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=flux`;
  
  console.log('\n=== Testing Normal Generation ===');
  console.log('URL:', url.substring(0, 200));
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log('Status Code:', res.statusCode);
      
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        
        if (res.statusCode === 200) {
          fs.writeFileSync(path.join(__dirname, 'test-normal.jpg'), buffer);
          console.log('Normal generation successful!');
          resolve({ success: true });
        } else {
          console.log('Normal generation failed with status:', res.statusCode);
          resolve({ success: false });
        }
      });
    }).on('error', (e) => {
      console.error('Request error:', e.message);
      resolve({ success: false });
    });
  });
};

// 主测试
(async () => {
  console.log('=== Testing Pollinations API ===\n');
  
  console.log('1. Testing normal generation (no reference image)...');
  const normalResult = await testNormalGeneration();
  console.log('Result:', normalResult.success ? 'PASS' : 'FAIL');
  
  console.log('\n2. Testing img2img generation (with reference image)...');
  const img2imgResult = await testImg2imgUrl();
  console.log('Result:', img2imgResult.success ? 'PASS' : 'FAIL');
  
  if (!img2imgResult.success) {
    console.log('\n=== Trying alternative img2img endpoint ===');
    
    // 尝试使用POST请求方式
    const postData = JSON.stringify({
      prompt: 'a beautiful landscape',
      image: createTestDataUrl(),
      width: 512,
      height: 512,
      model: 'flux'
    });
    
    const options = {
      hostname: 'image.pollinations.ai',
      path: '/prompt',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      console.log('POST Status Code:', res.statusCode);
      
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        if (res.statusCode === 200) {
          fs.writeFileSync(path.join(__dirname, 'test-post.jpg'), buffer);
          console.log('POST method successful!');
        } else {
          console.log('POST failed:', buffer.toString('utf-8').substring(0, 500));
        }
      });
    });
    
    req.on('error', (e) => console.error('POST error:', e.message));
    req.write(postData);
    req.end();
  }
  
  console.log('\n=== Tests completed ===');
})();
